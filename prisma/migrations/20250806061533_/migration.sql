-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
