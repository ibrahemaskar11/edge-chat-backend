import { Router } from "express";
import * as authController from "../controllers/authController";

const router: Router = Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
