-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'PUBLIC_USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityProgressStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PUBLIC_USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessibilityPreferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_email_canonical_check" CHECK ("email" = lower(trim("email")) AND length(trim("email")) > 0),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'DRAFT',
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStep" (
    "id" UUID NOT NULL,
    "guideId" UUID NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GuideStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publicationState" "PublicationState" NOT NULL DEFAULT 'DRAFT',
    "categoryId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityQuestion" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "orderNumber" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "choices" TEXT[],
    "expectedAnswer" TEXT NOT NULL,
    "immediateFeedback" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ActivityQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "ActivityProgressStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "score" DECIMAL(5,2),
    "submittedResponses" JSONB,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ActivityProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_title_idx" ON "Guide"("title");

-- CreateIndex
CREATE INDEX "Guide_categoryId_idx" ON "Guide"("categoryId");

-- CreateIndex
CREATE INDEX "Guide_publicationState_idx" ON "Guide"("publicationState");

-- CreateIndex
CREATE UNIQUE INDEX "GuideStep_guideId_orderNumber_key" ON "GuideStep"("guideId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_slug_key" ON "Activity"("slug");

-- CreateIndex
CREATE INDEX "Activity_title_idx" ON "Activity"("title");

-- CreateIndex
CREATE INDEX "Activity_categoryId_idx" ON "Activity"("categoryId");

-- CreateIndex
CREATE INDEX "Activity_publicationState_idx" ON "Activity"("publicationState");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityQuestion_activityId_orderNumber_key" ON "ActivityQuestion"("activityId", "orderNumber");

-- CreateIndex
CREATE INDEX "ActivityProgress_userId_idx" ON "ActivityProgress"("userId");

-- CreateIndex
CREATE INDEX "ActivityProgress_activityId_idx" ON "ActivityProgress"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityProgress_userId_activityId_attemptNumber_key" ON "ActivityProgress"("userId", "activityId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshSession_familyId_idx" ON "RefreshSession"("familyId");

-- CreateIndex
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_familyId_idx" ON "RefreshSession"("userId", "familyId");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_expiresAt_idx" ON "RefreshSession"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStep" ADD CONSTRAINT "GuideStep_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityQuestion" ADD CONSTRAINT "ActivityQuestion_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityProgress" ADD CONSTRAINT "ActivityProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityProgress" ADD CONSTRAINT "ActivityProgress_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
