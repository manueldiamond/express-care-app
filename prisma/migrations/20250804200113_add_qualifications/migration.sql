/*
  Warnings:

  - You are about to drop the column `availability` on the `CaregiverProfile` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `CaregiverProfile` table. All the data in the column will be lost.
  - You are about to drop the column `timeAvailable` on the `CaregiverProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CaregiverProfile" DROP COLUMN "availability",
DROP COLUMN "skills",
DROP COLUMN "timeAvailable",
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "schedule" TEXT;

-- CreateTable
CREATE TABLE "Qualification" (
    "id" SERIAL NOT NULL,
    "caregiverProfileId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fileURL" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Qualification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_caregiverProfileId_fkey" FOREIGN KEY ("caregiverProfileId") REFERENCES "CaregiverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
