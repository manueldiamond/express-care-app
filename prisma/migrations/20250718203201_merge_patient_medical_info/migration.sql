/*
  Warnings:

  - You are about to drop the `PatientMedicalInfo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `condition` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `schedule` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `years` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PatientMedicalInfo" DROP CONSTRAINT "PatientMedicalInfo_patientId_fkey";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "condition" TEXT NOT NULL,
ADD COLUMN     "description" TEXT DEFAULT '',
ADD COLUMN     "schedule" TEXT NOT NULL,
ADD COLUMN     "special" TEXT DEFAULT '',
ADD COLUMN     "years" TEXT NOT NULL;

-- DropTable
DROP TABLE "PatientMedicalInfo";
