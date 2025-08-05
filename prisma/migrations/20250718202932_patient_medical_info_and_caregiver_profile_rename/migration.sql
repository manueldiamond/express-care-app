/*
  Warnings:

  - You are about to drop the `Caregiver` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Caregiver" DROP CONSTRAINT "Caregiver_userId_fkey";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "medicalHistory" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "contact" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "location" TEXT;

-- DropTable
DROP TABLE "Caregiver";

-- CreateTable
CREATE TABLE "CaregiverProfile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "availability" BOOLEAN NOT NULL DEFAULT false,
    "timeAvailable" TEXT,
    "educationLevel" TEXT,
    "skills" TEXT[],

    CONSTRAINT "CaregiverProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientMedicalInfo" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "years" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "special" TEXT DEFAULT '',

    CONSTRAINT "PatientMedicalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaregiverProfile_userId_key" ON "CaregiverProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientMedicalInfo_patientId_key" ON "PatientMedicalInfo"("patientId");

-- AddForeignKey
ALTER TABLE "CaregiverProfile" ADD CONSTRAINT "CaregiverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientMedicalInfo" ADD CONSTRAINT "PatientMedicalInfo_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
