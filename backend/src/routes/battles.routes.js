const express = require("express");
const battlesController = require("../controllers/battles.controller");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/topics", battlesController.getTopics);
router.post("/queue", authenticate, battlesController.joinQueue);
router.delete("/queue", authenticate, battlesController.leaveQueue);
router.post("/create-room", authenticate, battlesController.createPrivateRoom);
router.post("/:code/join", authenticate, battlesController.joinRoomByCode);
router.get("/:id", optionalAuthenticate, battlesController.getBattleState);
router.post("/:id/submit", authenticate, battlesController.submitInBattle);
router.post("/:id/forfeit", authenticate, battlesController.forfeitBattle);

module.exports = router;
