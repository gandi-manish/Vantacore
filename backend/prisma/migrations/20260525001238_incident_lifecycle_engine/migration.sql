-- AlterTable
ALTER TABLE "SocIncident" ADD COLUMN     "assignedAnalystId" TEXT,
ADD COLUMN     "lastUpdatedBy" TEXT,
ADD COLUMN     "resolutionNotes" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SocIncident_assignedAnalystId_idx" ON "SocIncident"("assignedAnalystId");
