-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('bn', 'en', 'unknown');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('medical', 'fire', 'accident', 'crime', 'flood', 'utility', 'public_service', 'infrastructure', 'other');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'in_review', 'assigned', 'resolved', 'rejected');

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255),
    "contact" VARCHAR(255),
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "language" "Language" NOT NULL DEFAULT 'unknown',
    "category" "ReportCategory",
    "urgency" "UrgencyLevel",
    "summary" TEXT,
    "suggestedAction" TEXT,
    "confidence" DOUBLE PRECISION,
    "embedding" DOUBLE PRECISION[],
    "possibleDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "matchedReportId" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
