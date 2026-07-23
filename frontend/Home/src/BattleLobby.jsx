import React, { useEffect, useState } from "react";
import { createPrivateBattleRoom, fetchBattleTopics, joinBattleQueue, joinBattleRoomByCode, leaveBattleQueue } from "./battleApi";

export function BattleLobby({ user, onBack, onStartBattle, socket }) {
  const [topics, setTopics] = useState(["All Topics", "Arrays", "Strings", "Trees", "Graphs", "Dynamic Programming", "Greedy", "Math", "Data Structures"]);
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [isSearching, setIsSearching] = useState(false);
  const [queueTimer, setQueueTimer] = useState(0);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    fetchBattleTopics()
      .then((data) => {
        if (data.topics && data.topics.length > 0) {
          setTopics(["All Topics", ...data.topics]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let interval = null;
    if (isSearching) {
      interval = setInterval(() => setQueueTimer((t) => t + 1), 1000);
    } else {
      setQueueTimer(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  useEffect(() => {
    if (!socket) return;

    const handleMatched = (data) => {
      setIsSearching(false);
      onStartBattle(data.battleId);
    };

    socket.on("matched", handleMatched);
    return () => {
      socket.off("matched", handleMatched);
    };
  }, [socket, onStartBattle]);

  async function handleFindMatch() {
    setErrorMsg("");
    setIsSearching(true);
    try {
      const res = await joinBattleQueue(selectedTopic);
      if (res.matched) {
        setIsSearching(false);
        onStartBattle(res.battleId);
      }
    } catch (err) {
      setIsSearching(false);
      setErrorMsg(err.message || "Matchmaking failed. Please try again.");
    }
  }

  async function handleCancelQueue() {
    setIsSearching(false);
    try {
      await leaveBattleQueue();
    } catch {}
  }

  async function handleCreatePrivateRoom() {
    setErrorMsg("");
    setIsCreatingRoom(true);
    try {
      const res = await createPrivateBattleRoom(selectedTopic);
      setCreatedRoomCode(res.roomCode);
      setIsCreatingRoom(false);
      // Join host socket to battle room
      if (socket) {
        socket.emit("join-battle", { battleId: res.battleId });
      }
      onStartBattle(res.battleId);
    } catch (err) {
      setIsCreatingRoom(false);
      setErrorMsg(err.message || "Failed to create private room.");
    }
  }

  async function handleJoinRoomCode(e) {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    setErrorMsg("");
    try {
      const res = await joinBattleRoomByCode(roomCodeInput.trim());
      if (socket) {
        socket.emit("join-battle", { battleId: res.battleId });
      }
      onStartBattle(res.battleId);
    } catch (err) {
      setErrorMsg(err.message || "Could not join room code.");
    }
  }

  return (
    <main className="battle-shell">
      <header>
        <button className="back" onClick={onBack}>
          ← Dashboard
        </button>
        <span className="eyebrow">1v1 Battle Arena</span>
      </header>

      <div className="battle-lobby-container">
        <section className="lobby-hero">
          <p className="eyebrow">{user?.name || "Coder"} / 1v1 Arena</p>
          <h1>SELECT YOUR TOPIC.<br />DOMINATE THE DUEL.</h1>
          <p>Test your speed, correctness, and asymptotic complexity in real-time head-to-head duels.</p>
        </section>

        {errorMsg && <div className="battle-error-alert">⚠️ {errorMsg}</div>}

        <div className="lobby-grid">
          {/* Main Quick Match Card */}
          <div className="lobby-card match-card">
            <h3>⚔️ Quick Duel Matchmaking</h3>
            <p>Choose a data structure or topic, then match against an online coder of similar rating.</p>

            <div className="topic-selector">
              <label>Topic Filter:</label>
              <select value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} disabled={isSearching}>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {isSearching ? (
              <div className="searching-box">
                <div className="pulsing-spinner" />
                <p>Searching for an opponent in <strong>{selectedTopic}</strong>…</p>
                <span className="queue-timer">{queueTimer}s elapsed</span>
                <button className="text-button cancel-btn" onClick={handleCancelQueue}>
                  Cancel Search
                </button>
              </div>
            ) : (
              <button className="solid-button find-match-btn" onClick={handleFindMatch}>
                Find Match ⚔️
              </button>
            )}
          </div>

          {/* Friend Private Duel Card */}
          <div className="lobby-card private-card">
            <h3>🔑 Friend Challenge Room</h3>
            <p>Create a private battle room to share a code with a friend or join an existing room.</p>

            <button className="solid-button secondary-btn" onClick={handleCreatePrivateRoom} disabled={isCreatingRoom || isSearching}>
              {isCreatingRoom ? "Creating Room…" : "Create Private Room ➕"}
            </button>

            <div className="divider-or"><span>OR JOIN WITH CODE</span></div>

            <form onSubmit={handleJoinRoomCode} className="room-code-form">
              <input
                type="text"
                placeholder="Enter 6-letter Room Code"
                maxLength={6}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              />
              <button type="submit" className="solid-button" disabled={!roomCodeInput.trim()}>
                Join Room
              </button>
            </form>
          </div>

          {/* User Stat Summary Card */}
          <div className="lobby-card stats-card">
            <h3>📊 Your Duel Profile</h3>
            <div className="profile-stat-item">
              <span className="stat-label">Battle Rating</span>
              <span className="stat-value">{user?.battle_rating || 1200} Elo</span>
            </div>
            <div className="profile-stat-item">
              <span className="stat-label">League Tier</span>
              <span className="stat-value text-accent">Gladiator</span>
            </div>
            <div className="battle-rules-tip">
              <strong>Duel Rules:</strong>
              <ul>
                <li>🥇 <strong>First Accepted</strong> wins if only one solves it.</li>
                <li>⚡ <strong>Better Time & Space Complexity</strong> breaks ties if both solve it.</li>
                <li>⏱️ Runtimes break ties when complexities match.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
