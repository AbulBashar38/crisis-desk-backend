import swaggerJSDoc from "swagger-jsdoc";
import config from "../config/index.js";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CrisisDesk AI API",
      version: "1.0.0",
      description:
        "Intelligent backend API for emergency & service request triage.",
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: "Local development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);