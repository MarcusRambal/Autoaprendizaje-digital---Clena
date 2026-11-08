-- Solicitudes de ayuda: ahora las registra el personal en el mostrador.
-- Estado intermedio "En atencion" (IN_PROGRESS) antes de ATTENDED.
ALTER TYPE "HelpRequestStatus" ADD VALUE 'IN_PROGRESS' BEFORE 'ATTENDED';

-- description pasa a llamarse topic (tema de ayuda) conservando los datos.
ALTER TABLE "HelpRequest" RENAME COLUMN "description" TO "topic";

-- Nombre de la persona atendida (puede no tener cuenta).
ALTER TABLE "HelpRequest" ADD COLUMN "requesterName" VARCHAR(100);

-- Una guia puede ser solo un PDF: descripcion y cuerpo dejan de ser obligatorios.
ALTER TABLE "Guide" ALTER COLUMN "description" SET DEFAULT '';
ALTER TABLE "Guide" ALTER COLUMN "body" SET DEFAULT '';

-- PDF de cada guia, guardado en PostgreSQL (se respalda junto con la base de datos).
CREATE TABLE "GuideFile" (
    "guideId" UUID NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GuideFile_pkey" PRIMARY KEY ("guideId")
);

ALTER TABLE "GuideFile" ADD CONSTRAINT "GuideFile_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Regla que Prisma no puede expresar en schema.prisma.
ALTER TABLE "GuideFile" ADD CONSTRAINT "GuideFile_size_check" CHECK ("sizeBytes" > 0);
