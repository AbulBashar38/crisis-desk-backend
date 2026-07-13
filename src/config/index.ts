import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  app_url: process.env.APP_URL,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  gemini_api_key: process.env.GEMINI_API_KEY!,
  rate_limit_window_ms: process.env.RATE_LIMIT_WINDOW_MS || "900000",
  rate_limit_max: process.env.RATE_LIMIT_MAX || "100",
};
