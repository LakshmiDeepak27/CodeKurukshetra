const crypto = require("crypto");
const { query } = require("../config/db");
const submissionsService = require("./submissions.service");
const { AppError } = require("../middleware/errorHandler");

// In-memory queue for quick matchmaking by topic
// Map<topic, Array<{ userId, user, socketId, queuedAt }>>
const queueMap = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Simple heuristic parser for time & space complexity estimation
function estimateComplexity(code = "", language = "cpp") {
  const cleanCode = code.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ""); // strip comments
  const lines = cleanCode.split("\n");

  let loopDepth = 0;
  let maxLoopDepth = 0;
  let hasLogarithm = false;
  let hasSort = false;
  let hasRecursion = false;
  let hasAuxiliaryMapOrSet = false;
  let has2DArray = false;
  let has1DArray = false;

  const loopRegex = /\b(for|while)\b/;
  const logRegex = /(\/=\s*2|>>=\s*1|binarySearch|log2?|mid\s*=|step\s*\*=\s*2)/i;
  const sortRegex = /\b(sort|sorted|Arrays\.sort|Collections\.sort)\b/;
  const recursionRegex = /\b(solve|dfs|bfs|helper|backtrack|permute)\s*\(/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (loopRegex.test(trimmed)) {
      loopDepth++;
      if (loopDepth > maxLoopDepth) maxLoopDepth = loopDepth;
    }
    if (trimmed.includes("}") && loopDepth > 0) {
      loopDepth--;
    }
    if (logRegex.test(trimmed)) hasLogarithm = true;
    if (sortRegex.test(trimmed)) hasSort = true;
    if (recursionRegex.test(trimmed)) hasRecursion = true;
    if (/\b(unordered_map|unordered_set|map|set|dict|HashMap|HashSet)\b/i.test(trimmed)) {
      hasAuxiliaryMapOrSet = true;
    }
    if (/(\[\s*\]\s*\[\s*\]|vector\s*<\s*vector|ArrayList\s*<\s*ArrayList)/i.test(trimmed)) {
      has2DArray = true;
    } else if (/(\[\s*\]|vector\s*<|ArrayList\s*<|list\b|new\s+int)/i.test(trimmed)) {
      has1DArray = true;
    }
  });

  // Determine Time Complexity Class
  let timeComplexity = "O(n)";
  if (maxLoopDepth >= 2) {
    timeComplexity = hasLogarithm ? "O(n log n)" : "O(n^2)";
  } else if (maxLoopDepth === 1) {
    if (hasSort) timeComplexity = "O(n log n)";
    else if (hasLogarithm) timeComplexity = "O(log n)";
    else timeComplexity = "O(n)";
  } else if (hasSort) {
    timeComplexity = "O(n log n)";
  } else if (hasLogarithm || hasRecursion) {
    timeComplexity = "O(log n)";
  } else {
    timeComplexity = "O(1)";
  }

  // Determine Space Complexity Class
  let spaceComplexity = "O(1)";
  if (has2DArray) spaceComplexity = "O(n^2)";
  else if (has1DArray || hasAuxiliaryMapOrSet || hasRecursion) spaceComplexity = "O(n)";
  else spaceComplexity = "O(1)";

  return { timeComplexity, spaceComplexity };
}

// Complexity rank lookup (higher rank = better efficiency)
const COMPLEXITY_RANK = {
  "O(1)": 4,
  "O(log n)": 3,
  "O(n)": 2,
  "O(n log n)": 1,
  "O(n^2)": 0,
};

function rankComplexity(cmp) {
  return COMPLEXITY_RANK[cmp] ?? 1;
}

// Elo Rating calculation
function calculateNewRatings(ratingA, ratingB, outcomeA) {
  const K = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const newRatingA = Math.round(ratingA + K * (outcomeA - expectedA));
  const newRatingB = Math.round(ratingB + K * ((1 - outcomeA) - expectedB));

  return {
    newRatingA: Math.max(100, newRatingA),
    newRatingB: Math.max(100, newRatingB),
    deltaA: newRatingA - ratingA,
    deltaB: newRatingB - ratingB,
  };
}

class BattlesService {
  setIo(io) {
    this.io = io;
  }

  async getTopics() {
    const rows = await query(`
      SELECT DISTINCT tag 
      FROM problem_tags 
      ORDER BY tag ASC
    `);
    const tags = rows.map((r) => r.tag);
    return tags.length > 0
      ? tags
      : ["Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming", "Greedy", "Math", "Data Structures"];
  }

  async pickRandomProblem(topic) {
    let rows = [];
    if (topic && topic !== "all" && topic !== "All Topics") {
      rows = await query(
        `
        SELECT p.id 
        FROM problems p
        JOIN problem_tags pt ON pt.problem_id = p.id
        WHERE pt.tag = ? AND p.is_active = 1
        ORDER BY RAND()
        LIMIT 1
      `,
        [topic]
      );
    }

    if (rows.length === 0) {
      rows = await query(`
        SELECT id FROM problems WHERE is_active = 1 ORDER BY RAND() LIMIT 1
      `);
    }

    if (rows.length === 0) {
      throw new AppError(404, "No active problems found for battle selection");
    }

    return rows[0].id;
  }

  async createBattleRecord(topic, problemId, timeLimitSeconds = 900) {
    let roomCode = generateRoomCode();
    let unique = false;
    for (let i = 0; i < 5; i++) {
      const existing = await query("SELECT id FROM battles WHERE room_code = ?", [roomCode]);
      if (existing.length === 0) {
        unique = true;
        break;
      }
      roomCode = generateRoomCode();
    }

    const battleId = crypto.randomUUID();
    await query(
      `
      INSERT INTO battles (id, room_code, topic, problem_id, status, time_limit_seconds, started_at)
      VALUES (?, ?, ?, ?, 'active', ?, NOW())
    `,
      [battleId, roomCode, topic || "all", problemId, timeLimitSeconds]
    );

    return { battleId, roomCode, problemId };
  }

  async joinQueue(user, topic = "all", socketId = null) {
    const normalizedTopic = topic || "all";
    let list = queueMap.get(normalizedTopic) || [];

    // Filter out duplicate joins or current user
    list = list.filter((item) => item.userId !== user.id);
    queueMap.set(normalizedTopic, list);

    // Look for opponent
    if (list.length > 0) {
      const opponent = list.shift();
      queueMap.set(normalizedTopic, list);

      const problemId = await this.pickRandomProblem(normalizedTopic);
      const { battleId, roomCode } = await this.createBattleRecord(normalizedTopic, problemId);

      // Add both players to battle_players
      await query(
        `
        INSERT INTO battle_players (battle_id, user_id, status)
        VALUES (?, ?, 'active'), (?, ?, 'active')
      `,
        [battleId, user.id, battleId, opponent.userId]
      );

      // Notify socket server of match if io set
      if (this.io) {
        const battleData = { battleId, roomCode, problemId, topic: normalizedTopic };
        this.io.to(`user:${user.id}`).emit("matched", { ...battleData, opponent: opponent.user });
        this.io.to(`user:${opponent.userId}`).emit("matched", { ...battleData, opponent: user });
      }

      return {
        matched: true,
        battleId,
        roomCode,
        problemId,
        opponent: opponent.user,
      };
    }

    // Add to waiting queue
    list.push({ userId: user.id, user, socketId, queuedAt: Date.now() });
    queueMap.set(normalizedTopic, list);

    return { matched: false, position: list.length };
  }

  leaveQueue(userId) {
    for (const [topic, list] of queueMap.entries()) {
      const filtered = list.filter((item) => item.userId !== userId);
      queueMap.set(topic, filtered);
    }
    return { success: true };
  }

  async createPrivateRoom(user, topic = "all") {
    const problemId = await this.pickRandomProblem(topic);
    let roomCode = generateRoomCode();
    const battleId = crypto.randomUUID();

    await query(
      `
      INSERT INTO battles (id, room_code, topic, problem_id, status, time_limit_seconds, started_at)
      VALUES (?, ?, ?, ?, 'waiting', 900, NULL)
    `,
      [battleId, roomCode, topic || "all", problemId]
    );

    await query(
      `
      INSERT INTO battle_players (battle_id, user_id, status)
      VALUES (?, ?, 'active')
    `,
      [battleId, user.id]
    );

    return { battleId, roomCode, problemId, status: "waiting" };
  }

  async joinRoomByCode(user, roomCode) {
    const battles = await query(`SELECT * FROM battles WHERE room_code = ?`, [roomCode.trim().toUpperCase()]);
    if (battles.length === 0) {
      throw new AppError(404, "Invalid room code. Please check and try again.");
    }

    const battle = battles[0];
    if (battle.status === "finished" || battle.status === "abandoned") {
      throw new AppError(400, "This battle has already concluded.");
    }

    const existingPlayers = await query(`SELECT * FROM battle_players WHERE battle_id = ?`, [battle.id]);
    const isAlreadyIn = existingPlayers.some((p) => p.user_id === user.id);

    if (!isAlreadyIn) {
      if (existingPlayers.length >= 2) {
        throw new AppError(400, "This battle room is already full (2/2 players).");
      }
      await query(`INSERT INTO battle_players (battle_id, user_id, status) VALUES (?, ?, 'active')`, [battle.id, user.id]);
    }

    // If second player joined and battle was waiting, set active and started_at
    if (battle.status === "waiting" && (existingPlayers.length === 1 || isAlreadyIn)) {
      await query(`UPDATE battles SET status = 'active', started_at = NOW() WHERE id = ?`, [battle.id]);
      if (this.io) {
        this.io.to(`battle:${battle.id}`).emit("battle:started", { battleId: battle.id, startedAt: new Date() });
      }
    }

    return { battleId: battle.id, roomCode: battle.room_code, problemId: battle.problem_id };
  }

  async getBattleState(battleId, userId) {
    const battles = await query(`SELECT * FROM battles WHERE id = ?`, [battleId]);
    if (battles.length === 0) {
      throw new AppError(404, "Battle not found");
    }

    const battle = battles[0];
    const players = await query(
      `
      SELECT bp.*, u.name, u.email, u.avatar_url, u.battle_rating
      FROM battle_players bp
      JOIN users u ON u.id = bp.user_id
      WHERE bp.battle_id = ?
    `,
      [battleId]
    );

    const problemRows = await query(`SELECT * FROM problems WHERE id = ?`, [battle.problem_id]);
    const problem = problemRows[0] || null;

    let remainingSeconds = battle.time_limit_seconds;
    if (battle.started_at && battle.status === "active") {
      const elapsed = Math.floor((Date.now() - new Date(battle.started_at).getTime()) / 1000);
      remainingSeconds = Math.max(0, battle.time_limit_seconds - elapsed);
    } else if (battle.status === "finished") {
      remainingSeconds = 0;
    }

    return {
      battle,
      players,
      problem,
      remainingSeconds,
    };
  }

  async submitInBattle({ battleId, userId, code, language }) {
    const battleState = await this.getBattleState(battleId, userId);
    const { battle, players } = battleState;

    if (battle.status !== "active") {
      throw new AppError(400, "Battle is not currently active.");
    }

    const player = players.find((p) => p.user_id === userId);
    if (!player) {
      throw new AppError(403, "You are not a participant in this battle.");
    }

    // Execute through existing judge pipeline
    const submissionResult = await submissionsService.submitCode({
      userId,
      problemId: battle.problem_id,
      code,
      language,
      mode: "submit",
    });

    // Tag submission with battle_id
    if (submissionResult.submissionId) {
      await query(`UPDATE submissions SET battle_id = ? WHERE id = ?`, [battleId, submissionResult.submissionId]);
    }

    // Record submission event
    await query(
      `
      INSERT INTO battle_events (battle_id, user_id, event_type, payload_json)
      VALUES (?, ?, 'submission', ?)
    `,
      [battleId, userId, JSON.stringify({ verdict: submissionResult.verdict, submissionId: submissionResult.submissionId })]
    );

    // Broadcast opponent status update via Socket.IO
    if (this.io) {
      this.io.to(`battle:${battleId}`).emit("opponent:status", {
        userId,
        status: submissionResult.verdict === "Accepted" ? "accepted" : "submitted",
        verdict: submissionResult.verdict,
      });
    }

    // If Accepted, record metrics on battle_players
    if (submissionResult.verdict === "Accepted") {
      const { timeComplexity, spaceComplexity } = estimateComplexity(code, language);

      // Sum case runtimes
      const totalRuntimeMs = (submissionResult.results || []).reduce((acc, curr) => acc + (curr.runtime_ms || 0), 0);

      await query(
        `
        UPDATE battle_players
        SET 
          best_submission_id = ?,
          first_accepted_at = IFNULL(first_accepted_at, NOW()),
          time_complexity_estimate = ?,
          space_complexity_estimate = ?,
          total_runtime_ms = ?
        WHERE battle_id = ? AND user_id = ?
      `,
        [submissionResult.submissionId, timeComplexity, spaceComplexity, totalRuntimeMs, battleId, userId]
      );
    }

    // Evaluate winner rules
    await this.maybeDeclareWinner(battleId);

    // Refetch updated battle state
    const updatedState = await this.getBattleState(battleId, userId);
    return {
      ...submissionResult,
      battleStatus: updatedState.battle.status,
      winnerUserId: updatedState.battle.winner_user_id,
      winReason: updatedState.battle.win_reason,
    };
  }

  async maybeDeclareWinner(battleId) {
    const battleState = await this.getBattleState(battleId, null);
    const { battle, players } = battleState;

    if (battle.status === "finished" || battle.status === "abandoned") {
      return;
    }

    if (players.length < 2) {
      return; // Waiting for second player
    }

    const [p1, p2] = players;

    const p1Accepted = Boolean(p1.first_accepted_at);
    const p2Accepted = Boolean(p2.first_accepted_at);

    // Rule 1: First accepted wins if only one player solved it
    if (p1Accepted && !p2Accepted) {
      return this.endBattle(battleId, p1.user_id, "first_accepted");
    }
    if (p2Accepted && !p1Accepted) {
      return this.endBattle(battleId, p2.user_id, "first_accepted");
    }

    // Rule 2: If BOTH players solved it
    if (p1Accepted && p2Accepted) {
      const rTime1 = rankComplexity(p1.time_complexity_estimate);
      const rTime2 = rankComplexity(p2.time_complexity_estimate);

      if (rTime1 > rTime2) return this.endBattle(battleId, p1.user_id, "better_time_complexity");
      if (rTime2 > rTime1) return this.endBattle(battleId, p2.user_id, "better_time_complexity");

      const rSpace1 = rankComplexity(p1.space_complexity_estimate);
      const rSpace2 = rankComplexity(p2.space_complexity_estimate);

      if (rSpace1 > rSpace2) return this.endBattle(battleId, p1.user_id, "better_space_complexity");
      if (rSpace2 > rSpace1) return this.endBattle(battleId, p2.user_id, "better_space_complexity");

      // Compare total wall-clock runtimes
      const rt1 = p1.total_runtime_ms || 0;
      const rt2 = p2.total_runtime_ms || 0;
      const diff = Math.abs(rt1 - rt2);
      const avg = (rt1 + rt2) / 2 || 1;

      if (diff / avg <= 0.05) {
        return this.endBattle(battleId, null, "draw");
      }

      const winnerId = rt1 < rt2 ? p1.user_id : p2.user_id;
      return this.endBattle(battleId, winnerId, "faster_runtime");
    }

    // Rule 3: Check if time expired and nobody solved it
    if (battleState.remainingSeconds <= 0) {
      return this.endBattle(battleId, null, "draw");
    }
  }

  async forfeitBattle(battleId, userId) {
    const battleState = await this.getBattleState(battleId, userId);
    const { players, battle } = battleState;

    if (battle.status === "finished") return battleState;

    await query(`UPDATE battle_players SET status = 'forfeited' WHERE battle_id = ? AND user_id = ?`, [battleId, userId]);

    const winner = players.find((p) => p.user_id !== userId);
    const winnerId = winner ? winner.user_id : null;

    await this.endBattle(battleId, winnerId, "opponent_forfeit");
    return this.getBattleState(battleId, userId);
  }

  async endBattle(battleId, winnerUserId, winReason) {
    await query(
      `
      UPDATE battles
      SET status = 'finished', ended_at = NOW(), winner_user_id = ?, win_reason = ?
      WHERE id = ?
    `,
      [winnerUserId, winReason, battleId]
    );

    const players = await query(
      `
      SELECT bp.*, u.battle_rating
      FROM battle_players bp
      JOIN users u ON u.id = bp.user_id
      WHERE bp.battle_id = ?
    `,
      [battleId]
    );

    let eloDeltas = {};

    if (players.length === 2) {
      const [p1, p2] = players;
      let outcome1 = 0.5; // default draw
      if (winnerUserId === p1.user_id) outcome1 = 1;
      else if (winnerUserId === p2.user_id) outcome1 = 0;

      const { newRatingA, newRatingB, deltaA, deltaB } = calculateNewRatings(
        p1.battle_rating || 1200,
        p2.battle_rating || 1200,
        outcome1
      );

      await query(`UPDATE users SET battle_rating = ? WHERE id = ?`, [newRatingA, p1.user_id]);
      await query(`UPDATE users SET battle_rating = ? WHERE id = ?`, [newRatingB, p2.user_id]);

      eloDeltas[p1.user_id] = deltaA;
      eloDeltas[p2.user_id] = deltaB;
    }

    if (this.io) {
      this.io.to(`battle:${battleId}`).emit("battle:ended", {
        battleId,
        winnerUserId,
        winReason,
        eloDeltas,
      });
    }
  }
}

module.exports = new BattlesService();
