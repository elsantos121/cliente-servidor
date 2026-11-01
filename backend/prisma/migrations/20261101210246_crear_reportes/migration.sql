-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'RESUELTO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "reportes" (
    "id" SERIAL NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "autor_id" INTEGER NOT NULL,
    "publicacion_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_estado_idx" ON "reportes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "reportes_autor_id_publicacion_id_key" ON "reportes"("autor_id", "publicacion_id");

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes" ADD CONSTRAINT "reportes_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
