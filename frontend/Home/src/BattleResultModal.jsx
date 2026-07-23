import React from "react";

export function BattleResultModal({ user, battleState, eloDelta, onPlayAgain, onBackToLobby }) {
  if (!battleState) return null;

  const { battle, players } = battleState;
  const isWinner = battle.winner_user_id === user?.id;
  const isDraw = battle.win_reason === "draw" || !battle.winner_user_id;

  const opponent = players?.find((p) => p.user_id !== user?.id);

  let title = "BATTLE DRAW";
  let subtitle = "Both coders fought valiantly.";
  let badgeClass = "draw";
  let icon = "🤝";

  if (!isDraw) {
    if (isWinner) {
      title = "VICTORY!";
      subtitle = "You defeated your opponent in the 1v1 duel!";
      badgeClass = "victory";
      icon = "👑";
    } else {
      title = "DEFEAT";
      subtitle = "Your opponent claimed victory in this match.";
      badgeClass = "defeat";
      icon = "⚔️";
    }
  }

  function formatWinReason(reason) {
    switch (reason) {
      case "first_accepted":
        return "Accepted First — Solved all test cases ahead of opponent.";
      case "better_time_complexity":
        return "Better Time Complexity — Superior asymptotic efficiency.";
      case "better_space_complexity":
        return "Better Space Complexity — Superior memory allocation.";
      case "faster_runtime":
        return "Faster Runtime — Executed test suite in lower total time.";
      case "opponent_forfeit":
        return "Opponent Conceded — Match won by forfeit.";
      case "draw":
        return "Equal Performance — Equal runtime & complexity or timer expired.";
      default:
        return "Match Concluded";
    }
  }

  const delta = eloDelta?.[user?.id] ?? 0;
  const deltaText = delta >= 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="battle-modal-overlay">
      <div className={`battle-result-card ${badgeClass}`}>
        <div className="result-header">
          <span className="result-icon">{icon}</span>
          <h2>{title}</h2>
          <p className="result-subtitle">{subtitle}</p>
        </div>

        <div className="result-body">
          <div className="reason-pill">
            <span className="reason-label">Deciding Factor</span>
            <strong className="reason-text">{formatWinReason(battle.win_reason)}</strong>
          </div>

          <div className="result-stats-grid">
            <div className="stat-box">
              <span className="stat-label">Your Rating</span>
              <span className="stat-value">
                {user?.battle_rating || 1200} <small className={delta >= 0 ? "text-green" : "text-red"}>({deltaText})</small>
              </span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Opponent</span>
              <span className="stat-value">{opponent?.name || "Opponent"}</span>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <button className="solid-button" onClick={onPlayAgain}>
            Play Again ↺
          </button>
          <button className="text-button" onClick={onBackToLobby}>
            Return to Lobby →
          </button>
        </div>
      </div>
    </div>
  );
}
