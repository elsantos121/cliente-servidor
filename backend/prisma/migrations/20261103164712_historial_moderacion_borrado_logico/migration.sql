-- CreateEnum
CREATE TYPE "AccionModeracion" AS ENUM ('REPORTE_RESUELTO', 'REPORTE_DESCARTADO', 'PUBLICACION_OCULTADA', 'PUBLICACION_RESTAURADA', 'PUBLICACION_ELIMINADA');

-- AlterTable
ALTER TABLE "publicaciones" ADD COLUMN     "eliminada_en" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "eventos_moderacion" (
    "id" SERIAL NOT NULL,
    "accion" "AccionModeracion" NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "publicacion_id" INTEGER NOT NULL,
    "reporte_id" INTEGER,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_moderacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventos_moderacion_publicacion_id_creado_en_idx" ON "eventos_moderacion"("publicacion_id", "creado_en");

-- CreateIndex
CREATE INDEX "eventos_moderacion_accion_creado_en_idx" ON "eventos_moderacion"("accion", "creado_en");

-- AddForeignKey
ALTER TABLE "eventos_moderacion" ADD CONSTRAINT "eventos_moderacion_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_moderacion" ADD CONSTRAINT "eventos_moderacion_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_moderacion" ADD CONSTRAINT "eventos_moderacion_reporte_id_fkey" FOREIGN KEY ("reporte_id") REFERENCES "reportes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Los eventos de auditoría son append-only también a nivel de base de datos.
CREATE FUNCTION impedir_modificacion_evento_moderacion() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Los eventos de moderación son inmutables';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eventos_moderacion_inmutables
BEFORE UPDATE OR DELETE ON "eventos_moderacion"
FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_evento_moderacion();
