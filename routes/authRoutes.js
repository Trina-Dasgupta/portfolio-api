import { Router } from "express";
import {
  loginController,
  logoutController,
} from "../controllers/authControllers.js";
import { verifyAdmin } from "../middlewares/checkAuth.js";

const authRouter = Router();

authRouter.post("/login", loginController);

authRouter.post("/logout", logoutController);

authRouter.get("/check", verifyAdmin, (req, res) => {
  return res.status(200).json({ success: true, loggedIn: true });
});

export default authRouter;
