import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { loginValidationSchema, registerValidationSchema } from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(registerValidationSchema), authController.registerUser);
router.post("/login", validateRequest(loginValidationSchema), authController.loginUser);

export const authRoutes = router;
