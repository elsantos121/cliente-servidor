-- CreateEnum
CREATE TYPE "ValorVoto" AS ENUM ('POSITIVO', 'NEGATIVO');

-- CreateTable
CREATE TABLE "votos_publicaciones" (
    "id" SERIAL NOT NULL,
    "valor" "ValorVoto" NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "publicacion_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_comentarios" (
    "id" SERIAL NOT NULL,
    "valor" "ValorVoto" NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "comentario_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "votos_publicaciones_publicacion_id_valor_idx" ON "votos_publicaciones"("publicacion_id", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "votos_publicaciones_usuario_id_publicacion_id_key" ON "votos_publicaciones"("usuario_id", "publicacion_id");

-- CreateIndex
CREATE INDEX "votos_comentarios_comentario_id_valor_idx" ON "votos_comentarios"("comentario_id", "valor");

-- CreateIndex
CREATE UNIQUE INDEX "votos_comentarios_usuario_id_comentario_id_key" ON "votos_comentarios"("usuario_id", "comentario_id");

-- AddForeignKey
ALTER TABLE "votos_publicaciones" ADD CONSTRAINT "votos_publicaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_publicaciones" ADD CONSTRAINT "votos_publicaciones_publicacion_id_fkey" FOREIGN KEY ("publicacion_id") REFERENCES "publicaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_comentarios" ADD CONSTRAINT "votos_comentarios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_comentarios" ADD CONSTRAINT "votos_comentarios_comentario_id_fkey" FOREIGN KEY ("comentario_id") REFERENCES "comentarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
