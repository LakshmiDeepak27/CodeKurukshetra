import React, { useCallback, useEffect, useState } from "react";
import EditorWorkspace from "../../Editor/src/App.jsx";
import { fetchBattleState, forfeitBattleMatch, submitBattleCode } from "./battleApi";

export function BattleRoom({ user, battleId, onExit, socket, onBattleEnd }) {
  const [battleState, setBattleState] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(900);
  const [opponentStatus, setOpponentStatus] = useState("coding");
  const [errorMsg, setErrorMsg] = useState("");

  const loadState = useCallback(async () => {
    try {
      const data = await fetchBattleState(battleId);
      setBattleState(data);
      setRemainingSeconds(data.remainingSeconds);
      if (data.battle.status === "finished") {
        onBattleEnd({ battleState: data });
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to load battle state.");
    }
  }, [battleId, onBattleEnd]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  useEffect(() => {
    if (!socket || !battleId) return;

    socket.emit("join-battle", { battleId });

    const handleTimerTick = (data) => {
      if (data.battleId === battleId) {
        setRemainingSeconds(data.remainingSeconds);
        if (data.status === "finished") {
          loadState();
        }
      }
    };

    const handleOpponentStatus = (data) => {
      if (data.userId !== user?.id) {
        setOpponentStatus(data.status || "submitted");
      }
    };

    const handleBattleEnded = (data) => {
      loadState();
    };

    socket.on("timer:tick", handleTimerTick);
    socket.on("opponent:status", handleOpponentStatus);
    socket.on("battle:ended", handleBattleEnded);

    return () => {
      socket.emit("leave-battle", { battleId });
      socket.off("timer:tick", handleTimerTick);
      socket.off("opponent:status", handleOpponentStatus);
      socket.off("battle:ended", handleBattleEnded);
    };
  }, [socket, battleId, user?.id, loadState]);

  const handleForfeit = async () => {
    if (window.confirm("Are you sure you want to forfeit this duel match? Your rating will decrease.")) {
      try {
        const updated = await forfeitBattleMatch(battleId);
        onBattleEnd({ battleState: updated });
      } catch (err) {
        alert(err.message || "Could not forfeit match.");
      }
    }
  };

  const handleBattleSubmit = async (mode, code, language) => {
    const result = await submitBattleCode(battleId, code, language);
    if (result.battleStatus === "finished") {
      loadState();
    }
    return result;
  };

  const formatClock = (totalSecs) => {
    const m = Math.floor(Math.max(0, totalSecs) / 60);
    const s = Math.max(0, totalSecs) % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (errorMsg) {
    return (
      <main className="battle-shell">
        <header><button className="back" onClick={onExit}>← Lobby</button></header>
        <section><p className="eyebrow">Error loading battle</p><h2>{errorMsg}</h2><button className="solid-button" onClick={onExit}>Return to Lobby</button></section>
      </main>
    );
  }

  if (!battleState || !battleState.battle) {
    return (
      <main className="battle-shell">
        <header><button className="back" onClick={onExit}>← Lobby</button></header>
        <section><p className="eyebrow">Loading arena workspace…</p><div className="pulsing-spinner" /></section>
      </main>
    );
  }

  const { battle, players, problem } = battleState;
  const opponent = players.find((p) => p.user_id !== user?.id);

  return (
    <div className="battle-room-wrapper">
      {/* Top HUD Bar */}
      <header className="battle-hud-header">
        <div className="hud-left">
          <button className="hud-back-btn" onClick={onExit} title="Leave battle room">
            ← Lobby
          </button>
          <div className="battle-room-info">
            <span className="room-code-tag">ROOM: <strong>{battle.room_code}</strong></span>
            <span className="room-topic-tag">{battle.topic}</span>
          </div>
        </div>

        <div className="hud-center">
          <div className={`synced-timer-display ${remainingSeconds <= 120 ? "timer-warning" : ""}`}>
            <span className="clock-icon">⏱️</span>
            <span className="clock-value">{formatClock(remainingSeconds)}</span>
          </div>
        </div>

        <div className="hud-right">
          <div className="opponent-status-badge">
            <div className="opponent-avatar">
              {opponent?.avatar_url ? (
                <img src={opponent.avatar_url} alt="Opponent avatar" />
              ) : (
                <span>{(opponent?.name || "O")[0].toUpperCase()}</span>
              )}
            </div>
            <div className="opponent-details">
              <span className="opponent-name">{opponent?.name || "Waiting for opponent..."}</span>
              <span className="opponent-rating">{opponent?.battle_rating || 1200} Elo</span>
            </div>
            <div className={`opponent-pill ${opponentStatus}`}>
              {opponentStatus === "accepted" ? "✅ Accepted" : opponentStatus === "submitted" ? "⏳ Submitted" : "💻 Coding…"}
            </div>
          </div>

          <button className="forfeit-btn" onClick={handleForfeit} title="Concede match">
            Forfeit 🏳️
          </button>
        </div>
      </header>

      {/* Main Monaco Workspace */}
      <div className="battle-workspace-container">
        <EditorWorkspace
          onExit={onExit}
          overrideProblemId={problem?.id}
          onSubmitOverride={handleBattleSubmit}
        />
      </div>
    </div>
  );
}
