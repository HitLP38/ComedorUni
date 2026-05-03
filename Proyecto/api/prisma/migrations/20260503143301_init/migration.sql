-- CreateEnum
CREATE TYPE "EstadoAlumno" AS ENUM ('ACTIVO', 'SUSPENDIDO_7D', 'SUSPENDIDO_MANUAL');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ABIERTO', 'CERRADO', 'COMPLETO');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('PENDIENTE', 'ACTIVO', 'CONSUMIDO', 'EXPIRADO', 'CANCELADO', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TipoSancion" AS ENUM ('INASISTENCIA', 'ADVERTENCIA', 'SUSPENSION_7D', 'SUSPENSION_MANUAL');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'REGISTRO_INICIO', 'REGISTRO_VERIFICACION', 'RESERVA_CREADA', 'TICKET_VALIDADO', 'SANCION_APLICADA', 'CAMBIO_PIN', 'SOLICITUD_CREADA', 'ACCESO_ADMIN', 'QUEUE_LIBERATION');

-- CreateTable
CREATE TABLE "alumnos" (
    "id" SERIAL NOT NULL,
    "codigo_alumno" VARCHAR(8) NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "nombres_apellidos" VARCHAR(255) NOT NULL,
    "correo_uni" VARCHAR(255) NOT NULL,
    "facultad" VARCHAR(100) NOT NULL,
    "pin_hash" VARCHAR(255) NOT NULL,
    "estado" "EstadoAlumno" NOT NULL DEFAULT 'ACTIVO',
    "inasistencias_acumuladas" INTEGER NOT NULL DEFAULT 0,
    "fecha_suspension_hasta" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_ultima_modificacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "hora_apertura_reserva" VARCHAR(5) NOT NULL,
    "hora_cierre_reserva" VARCHAR(5) NOT NULL,
    "duracion_servicio_minutos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "servicio_id" INTEGER NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "duracion_minutos" INTEGER NOT NULL,
    "cupo_maximo" INTEGER NOT NULL,
    "cupo_actual" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ABIERTO',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "turno_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "codigo_ticket" VARCHAR(36) NOT NULL,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'PENDIENTE',
    "timestamp_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp_validacion" TIMESTAMP(3),
    "timestamp_expiracion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanciones" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "tipo" "TipoSancion" NOT NULL,
    "ticket_id" INTEGER,
    "fecha_aplicacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_levantamiento" TIMESTAMP(3),
    "razon" TEXT,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sanciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER NOT NULL,
    "codigo" VARCHAR(6) NOT NULL,
    "timestamp_generacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp_expiracion" TIMESTAMP(3) NOT NULL,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "consumido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_acceso" (
    "id" SERIAL NOT NULL,
    "alumno_id" INTEGER,
    "tipo_evento" "TipoEvento" NOT NULL,
    "ip_origen" VARCHAR(45) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detalles_json" TEXT,

    CONSTRAINT "logs_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_codigo_alumno_key" ON "alumnos"("codigo_alumno");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_dni_key" ON "alumnos"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "alumnos_correo_uni_key" ON "alumnos"("correo_uni");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_nombre_key" ON "servicios"("nombre");

-- CreateIndex
CREATE INDEX "turnos_fecha_idx" ON "turnos"("fecha");

-- CreateIndex
CREATE INDEX "turnos_servicio_id_idx" ON "turnos"("servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "turnos_servicio_id_fecha_hora_inicio_key" ON "turnos"("servicio_id", "fecha", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_codigo_ticket_key" ON "tickets"("codigo_ticket");

-- CreateIndex
CREATE INDEX "tickets_estado_idx" ON "tickets"("estado");

-- CreateIndex
CREATE INDEX "tickets_alumno_id_idx" ON "tickets"("alumno_id");

-- CreateIndex
CREATE INDEX "tickets_turno_id_idx" ON "tickets"("turno_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_alumno_id_fecha_turno_id_key" ON "tickets"("alumno_id", "fecha", "turno_id");

-- CreateIndex
CREATE UNIQUE INDEX "sanciones_ticket_id_key" ON "sanciones"("ticket_id");

-- CreateIndex
CREATE INDEX "sanciones_alumno_id_idx" ON "sanciones"("alumno_id");

-- CreateIndex
CREATE INDEX "sanciones_tipo_idx" ON "sanciones"("tipo");

-- CreateIndex
CREATE INDEX "otp_codes_alumno_id_idx" ON "otp_codes"("alumno_id");

-- CreateIndex
CREATE INDEX "otp_codes_timestamp_expiracion_idx" ON "otp_codes"("timestamp_expiracion");

-- CreateIndex
CREATE INDEX "logs_acceso_tipo_evento_idx" ON "logs_acceso"("tipo_evento");

-- CreateIndex
CREATE INDEX "logs_acceso_alumno_id_idx" ON "logs_acceso"("alumno_id");

-- CreateIndex
CREATE INDEX "logs_acceso_timestamp_idx" ON "logs_acceso"("timestamp");

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanciones" ADD CONSTRAINT "sanciones_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_acceso" ADD CONSTRAINT "logs_acceso_alumno_id_fkey" FOREIGN KEY ("alumno_id") REFERENCES "alumnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
