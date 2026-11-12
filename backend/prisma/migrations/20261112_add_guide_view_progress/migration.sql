-- CreateTable
CREATE TABLE "GuideProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "guideId" UUID NOT NULL,
    "readAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GuideProgress_userId_idx" ON "GuideProgress"("userId");

-- CreateIndex
CREATE INDEX "GuideProgress_guideId_idx" ON "GuideProgress"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProgress_userId_guideId_key" ON "GuideProgress"("userId", "guideId");

-- AddForeignKey
ALTER TABLE "GuideProgress" ADD CONSTRAINT "GuideProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideProgress" ADD CONSTRAINT "GuideProgress_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
