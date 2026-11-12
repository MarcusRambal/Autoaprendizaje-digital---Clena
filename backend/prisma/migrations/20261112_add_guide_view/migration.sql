CREATE TABLE "GuideView" (
    "id" UUID NOT NULL,
    "guideId" UUID NOT NULL,
    "viewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuideView_guideId_idx" ON "GuideView"("guideId");
CREATE INDEX "GuideView_viewedAt_idx" ON "GuideView"("viewedAt");
CREATE INDEX "GuideView_guideId_viewedAt_idx" ON "GuideView"("guideId", "viewedAt");

ALTER TABLE "GuideView"
ADD CONSTRAINT "GuideView_guideId_fkey"
FOREIGN KEY ("guideId") REFERENCES "Guide"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
