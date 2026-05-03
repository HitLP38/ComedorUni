import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HORARIOS_ALMUERZO = ['11:30', '12:00', '12:30', '13:00', '13:30', '14:00'];
const DIAS_A_SEMBRAR = 7;
const CUPO_DEFECTO = 50;
const DURACION_TURNO_MIN = 30;

function fechaHoyMasDias(offsetDias: number): Date {
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  hoy.setUTCDate(hoy.getUTCDate() + offsetDias);
  return hoy;
}

async function main() {
  console.log('🌱 Sembrando servicios...');

  const almuerzo = await prisma.servicio.upsert({
    where: { nombre: 'ALMUERZO' },
    update: {
      hora_apertura_reserva: '06:00',
      hora_cierre_reserva: '14:00',
      duracion_servicio_minutos: DURACION_TURNO_MIN,
      activo: true,
    },
    create: {
      nombre: 'ALMUERZO',
      hora_apertura_reserva: '06:00',
      hora_cierre_reserva: '14:00',
      duracion_servicio_minutos: DURACION_TURNO_MIN,
      activo: true,
    },
  });

  const cena = await prisma.servicio.upsert({
    where: { nombre: 'CENA' },
    update: {
      hora_apertura_reserva: '14:00',
      hora_cierre_reserva: '19:00',
      duracion_servicio_minutos: DURACION_TURNO_MIN,
      activo: true,
    },
    create: {
      nombre: 'CENA',
      hora_apertura_reserva: '14:00',
      hora_cierre_reserva: '19:00',
      duracion_servicio_minutos: DURACION_TURNO_MIN,
      activo: true,
    },
  });

  console.log(`  ✓ Servicio ALMUERZO id=${almuerzo.id}`);
  console.log(`  ✓ Servicio CENA id=${cena.id}`);

  console.log(`🌱 Sembrando turnos de almuerzo (${DIAS_A_SEMBRAR} días × ${HORARIOS_ALMUERZO.length} horarios)...`);

  let creados = 0;
  for (let offset = 0; offset < DIAS_A_SEMBRAR; offset++) {
    const fecha = fechaHoyMasDias(offset);
    for (const hora of HORARIOS_ALMUERZO) {
      await prisma.turno.upsert({
        where: {
          servicio_id_fecha_hora_inicio: {
            servicio_id: almuerzo.id,
            fecha,
            hora_inicio: hora,
          },
        },
        update: {
          cupo_maximo: CUPO_DEFECTO,
          duracion_minutos: DURACION_TURNO_MIN,
          estado: 'ABIERTO',
        },
        create: {
          servicio_id: almuerzo.id,
          fecha,
          hora_inicio: hora,
          duracion_minutos: DURACION_TURNO_MIN,
          cupo_maximo: CUPO_DEFECTO,
          cupo_actual: 0,
          estado: 'ABIERTO',
        },
      });
      creados++;
    }
  }

  console.log(`  ✓ ${creados} turnos de almuerzo upserteados.`);

  const totalServicios = await prisma.servicio.count();
  const totalTurnos = await prisma.turno.count();
  console.log(`✅ Seed completo. Servicios: ${totalServicios} | Turnos: ${totalTurnos}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('❌ Error en seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
