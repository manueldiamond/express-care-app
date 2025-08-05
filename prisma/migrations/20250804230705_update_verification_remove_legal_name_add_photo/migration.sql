/*
  Warnings:

  - You are about to drop the column `legalName` on the `Verification` table. All the data in the column will be lost.
  - Added the required column `photo` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CaregiverProfile" ALTER COLUMN "isActive" SET DEFAULT false,
ALTER COLUMN "isAvailable" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "legalName",
ADD COLUMN     "photo" TEXT NOT NULL;
