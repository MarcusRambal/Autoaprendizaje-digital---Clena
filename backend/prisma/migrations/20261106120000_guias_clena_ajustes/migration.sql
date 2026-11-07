-- CreateEnum
CREATE TYPE "HelpRequestStatus" AS ENUM ('PENDING', 'ATTENDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "ActivityProgress" DROP CONSTRAINT "ActivityProgress_userId_fkey";

-- AlterTable
ALTER TABLE "GuideStep" ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privacyAcceptedAt" TIMESTAMPTZ(6),
ADD COLUMN     "privacyNoticeVersion" TEXT;

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" UUID NOT NULL,
    "requesterId" UUID,
    "guideId" UUID,
    "description" TEXT NOT NULL,
    "status" "HelpRequestStatus" NOT NULL DEFAULT 'PENDING',
    "attendedById" UUID,
    "attendedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpRequest_status_createdAt_idx" ON "HelpRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "HelpRequest_requesterId_idx" ON "HelpRequest"("requesterId");

-- CreateIndex
CREATE INDEX "HelpRequest_guideId_idx" ON "HelpRequest"("guideId");

-- CreateIndex
CREATE INDEX "HelpRequest_attendedById_idx" ON "HelpRequest"("attendedById");

-- AddForeignKey
ALTER TABLE "ActivityProgress" ADD CONSTRAINT "ActivityProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_attendedById_fkey" FOREIGN KEY ("attendedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Reglas que Prisma no puede expresar en schema.prisma

-- Una solicitud atendida debe registrar cuando se atendio.
ALTER TABLE "HelpRequest" ADD CONSTRAINT "HelpRequest_attended_check" CHECK ("status" <> 'ATTENDED' OR "attendedAt" IS NOT NULL);

-- Busqueda de guias por palabra clave (titulo + descripcion, configuracion en espanol).
CREATE INDEX "Guide_search_fts_idx" ON "Guide" USING GIN (to_tsvector('spanish', "title" || ' ' || "description"));
