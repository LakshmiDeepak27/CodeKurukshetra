const leaderboardService = require("../services/leaderboard.service");

async function getLeaderboard(_req, res, next) {
  try {
    const leaderboard = await leaderboardService.getLeaderboard();
    return res.json({ leaderboard });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getLeaderboard };
