-- CreateTable
CREATE TABLE "administradores" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "administradores_username_key" ON "administradores"("username");
