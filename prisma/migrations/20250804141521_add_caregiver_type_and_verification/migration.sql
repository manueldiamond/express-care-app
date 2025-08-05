-- AlterTable
ALTER TABLE "CaregiverProfile" ADD COLUMN     "type" TEXT;

-- CreateTable
CREATE TABLE "Verification" (
    "id" SERIAL NOT NULL,
    "caregiverProfileId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Verification_caregiverProfileId_key" ON "Verification"("caregiverProfileId");

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_caregiverProfileId_fkey" FOREIGN KEY ("caregiverProfileId") REFERENCES "CaregiverProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
