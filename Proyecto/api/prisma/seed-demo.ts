/**
 * seed-demo.ts — Siembra 10 alumnos ficticios + 1 operador + 1 admin para demo.
 * Idempotente: usa upsert/skip-if-exists.
 */
import { PrismaClient } from '@prisma/client';
import { hashPin } from '../src/lib/crypto.js';

const prisma = new PrismaClient();

const ALUMNOS_DEMO = [
  { codigo_alumno: '20240001', dni: '12345671', nombres_apellidos: 'Ana García Ríos', correo_uni: 'a.garcia.rios@uni.pe', facultad: 'FIIS', pin: '246810' },
  { codigo_alumno: '20240002', dni: '87654323', nombres_apellidos: 'Carlos Mamani Quispe', correo_uni: 'c.mamani.quispe@uni.pe', facultad: 'FIC', pin: '246810' },
  { codigo_alumno: '20240003', dni: '11223346', nombres_apellidos: 'Diana Torres Vega', correo_uni: 'd.torres.vega@uni.pe', facultad: 'FIQT', pin: '246810' },
  { codigo_alumno: '20240004', dni: '44332258', nombres_apellidos: 'Eduardo Quispe Lima', correo_uni: 'e.quispe.lima@uni.pe', facultad: 'FIM', pin: '246810' },
  { codigo_alumno: '20240005', dni: '55667789', nombres_apellidos: 'Fernanda Castro Ruiz', correo_uni: 'f.castro.ruiz@uni.pe', facultad: 'FIEE', pin: '246810' },
  { codigo_alumno: '20240006', dni: '99887765', nombres_apellidos: 'Gonzalo Ramos Flores', correo_uni: 'g.ramos.flores@uni.pe', facultad: 'FP', pin: '246810' },
  { codigo_alumno: '20240007', dni: '22334457', nombres_apellidos: 'Hilda Vargas Cruz', correo_uni: 'h.vargas.cruz@uni.pe', facultad: 'FC', pin: '246810' },
  { codigo_alumno: '20240008', dni: '33445568', nombres_apellidos: 'Iván Morales Díaz', correo_uni: 'i.morales.diaz@uni.pe', facultad: 'FAUA', pin: '246810' },
  { codigo_alumno: '20240009', dni: '66778891', nombres_apellidos: 'Julia Paredes Soto', correo_uni: 'j.paredes.soto@uni.pe', facultad: 'FMT', pin: '246810' },
  { codigo_alumno: '20240010', dni: '77889902', nombres_apellidos: 'Kevin Huanca Puma', correo_uni: 'k.huanca.puma@uni.pe', facultad: 'FCE', pin: '246810' },
];

async function main() {
  console.log('🌱 Sembrando datos de demo...');

  // ── Alumnos ────────────────────────────────────────────────────────────────
  let alumnosCreados = 0;
  for (const alumno of ALUMNOS_DEMO) {
    const [porCodigo, porDni] = await Promise.all([
      prisma.alumno.findUnique({ where: { codigo_alumno: alumno.codigo_alumno } }),
      prisma.alumno.findUnique({ where: { dni: alumno.dni } }),
    ]);
    if (porCodigo || porDni) continue;

    const pin_hash = await hashPin(alumno.pin);
    await prisma.alumno.create({
      data: {
        codigo_alumno: alumno.codigo_alumno,
        dni: alumno.dni,
        nombres_apellidos: alumno.nombres_apellidos,
        correo_uni: alumno.correo_uni,
        facultad: alumno.facultad as any,
        pin_hash,
        correo_verificado: true,
        estado: 'ACTIVO',
      },
    });
    alumnosCreados++;
  }
  console.log(`  ✓ ${alumnosCreados} alumnos demo creados (${ALUMNOS_DEMO.length - alumnosCreados} ya existían).`);

  // ── Operador ───────────────────────────────────────────────────────────────
  const opExiste = await prisma.operador.findUnique({ where: { username: 'operador1' } });
  if (!opExiste) {
    const password_hash = await hashPin('Cambiar123!');
    await prisma.operador.create({
      data: { username: 'operador1', nombre: 'Operador Comedor', password_hash, activo: true },
    });
    console.log('  ✓ Operador demo creado: operador1 / Cambiar123!');
  } else {
    console.log('  – Operador ya existe.');
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminExiste = await prisma.administrador.findUnique({ where: { username: 'admin' } });
  if (!adminExiste) {
    const password_hash = await hashPin('Admin12345!');
    await prisma.administrador.create({
      data: { username: 'admin', nombre: 'Administrador RanchUNI', password_hash, activo: true },
    });
    console.log('  ✓ Admin demo creado: admin / Admin12345!');
  } else {
    console.log('  – Admin ya existe.');
  }

  console.log('\n✅ Seed demo completo.');
  console.log('\nCredenciales de prueba:');
  console.log('  Alumnos (10): DNI según tabla, PIN: 246810');
  console.log('  Operador:     username=operador1, password=Cambiar123!');
  console.log('  Admin:        username=admin, password=Admin12345!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (err) => {
    console.error('❌ Error en seed-demo:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
