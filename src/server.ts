import "dotenv/config";
import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const PORT = config.port ?? "8080";

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`📄 API Docs (Swagger UI):  http://localhost:${PORT}/api/docs`);
      console.log(`🧾 API Docs (JSON spec):   http://localhost:${PORT}/api/docs.json`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
