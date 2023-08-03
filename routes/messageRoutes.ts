import { Router } from "express";
import * as messageController from "../controllers/messageController";
import { protect } from "../controllers/authController";
const router: Router = Router();

router.use(protect);
// add message to chat
router.post("/", messageController.sendMessage);

// delete message from chat
router.delete("/:messageId", messageController.deleteMessage);

router.get('/', messageController.searchMessage)

export default router;
