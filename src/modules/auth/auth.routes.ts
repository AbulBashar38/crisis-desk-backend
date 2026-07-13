import { Router } from "express";
import { authLimiter } from "../../middlewares/rateLimiter";
import { validateRequest } from "../../middlewares/validateRequest";
import { authController } from "./auth.controller";
import { loginValidationSchema, registerValidationSchema } from "./auth.validation";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       409: { description: User already exists }
 */
router.post("/register", validateRequest(registerValidationSchema), authController.registerUser);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Admin login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: OK }
 *       400: { description: Validation error }
 *       401: { description: Invalid credentials }
 *       429: { description: Too many login attempts }
 */
router.post("/login", authLimiter, validateRequest(loginValidationSchema), authController.loginUser);

export const authRoutes = router;
