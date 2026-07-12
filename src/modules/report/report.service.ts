import { prisma } from "../../lib/prisma";
import { ICreateReport } from "./report.interface";

const createReport = async (payload: ICreateReport) => {
  const { name, contact, location, description, language } = payload;

  // TODO: Add AI classification & duplicate detection logic here

  const report = await prisma.report.create({
    data: {
      name,
      contact,
      location,
      description,
      language: language || "unknown",
    },
  });

  return report;
};

export const reportService = {
  createReport,
};
