import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../../app";

describe("POST /api/reports", () => {
  it("should return 400 if description is missing", async () => {
    const res = await request(app).post("/api/reports").send({
      location: "Dhaka",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 if location is missing", async () => {
    const res = await request(app).post("/api/reports").send({
      description: "There is a fire",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
