-- CreateTable
CREATE TABLE "SocIncident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "department" TEXT,
    "targetResourceId" TEXT,
    "targetResourceType" TEXT,
    "ipAddress" TEXT,
    "threatPattern" TEXT,
    "confidence" INTEGER,
    "eventCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocIncident_actorUserId_idx" ON "SocIncident"("actorUserId");

-- CreateIndex
CREATE INDEX "SocIncident_targetResourceId_idx" ON "SocIncident"("targetResourceId");

-- CreateIndex
CREATE INDEX "SocIncident_ipAddress_idx" ON "SocIncident"("ipAddress");

-- CreateIndex
CREATE INDEX "SocIncident_threatPattern_idx" ON "SocIncident"("threatPattern");

-- CreateIndex
CREATE INDEX "SocIncident_status_idx" ON "SocIncident"("status");
