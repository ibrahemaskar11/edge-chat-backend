import { Router } from "express";
import * as authController from "../controllers/authController";

const router = Router();

router.route("/login").post(authController.login);
router.post("/signup", authController.signup);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
