-- Solicitudes de ayuda: el usuario publico escribe nombre, asunto (topic) y descripcion.
-- Las solicitudes existentes quedan con descripcion vacia.
ALTER TABLE "HelpRequest" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
