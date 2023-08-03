import { Router } from "express";
import * as chatController from "../controllers/chatController";
import { protect } from "../controllers/authController";

const router: Router = Router();

//chat routes
router.use(protect);
router.get("/", chatController.fetchChats);
router.get("/:chatId", chatController.accessChat);
router.post("/", chatController.createChat);
router.post("/group", chatController.createGroupChat);
router.patch("/group-users/:chatId", chatController.updateGroupChatUsers);

router.patch("/group-admins/:chatId", chatController.updateGroupChatAdmins);
router.patch("/group/:chatId", chatController.updateGroupChat);
router.delete("/:chatId", chatController.deleteChat);
router.delete('/remove-group-user/:chatId', chatController.removeGroupChatUser)
router.post('/add-group-user/:chatId', chatController.addGroupChatUser)

// router.patch('/leave-group/:chatId', chatController.leaveGroupChat)

export default router;
