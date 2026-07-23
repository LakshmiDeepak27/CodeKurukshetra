const battlesService = require("../services/battles.service");

async function getTopics(_req, res, next) {
  try {
    const topics = await battlesService.getTopics();
    return res.json({ topics });
  } catch (error) {
    next(error);
  }
}

async function joinQueue(req, res, next) {
  try {
    const { topic } = req.body;
    const result = await battlesService.joinQueue(req.user, topic);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function leaveQueue(req, res, next) {
  try {
    const result = battlesService.leaveQueue(req.user.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function createPrivateRoom(req, res, next) {
  try {
    const { topic } = req.body;
    const result = await battlesService.createPrivateRoom(req.user, topic);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function joinRoomByCode(req, res, next) {
  try {
    const { code } = req.params;
    const result = await battlesService.joinRoomByCode(req.user, code);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getBattleState(req, res, next) {
  try {
    const { id } = req.params;
    const result = await battlesService.getBattleState(id, req.user?.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function submitInBattle(req, res, next) {
  try {
    const { id } = req.params;
    const { code, language } = req.body;
    const result = await battlesService.submitInBattle({
      battleId: id,
      userId: req.user.id,
      code,
      language,
    });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function forfeitBattle(req, res, next) {
  try {
    const { id } = req.params;
    const result = await battlesService.forfeitBattle(id, req.user.id);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTopics,
  joinQueue,
  leaveQueue,
  createPrivateRoom,
  joinRoomByCode,
  getBattleState,
  submitInBattle,
  forfeitBattle,
};
