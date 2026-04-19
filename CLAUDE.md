# Proyecto: RanchUNI — Monografía 1, HU501-U

## Qué es este proyecto

Aplicación web de gestión y emisión de tickets de turno para el comedor universitario de la UNI. Curso: Taller de Efectividad Personal. Docente: Felipe Tsutomu Hiromoto Hiromoto. Ciclo 26-1.

## Estado actual del proyecto

- Fase 1 (Planificación y diseño): entregado
- Fase 2 (Planificación de proyecto): entregado
- Fase 3 (Desarrollo): sin empezar
- Fase 4 (Entrega final): sin empezar

## Reglas de redacción académica

- Normas APA 7ma edición
- Formato de letra arial 12
- Lenguaje formal, sin coloquialismos
- Evitar Wikipedia, blogs, Monografías.com como fuentes

## Stack tecnológico decidido (2026-04-19)

- Backend: Node.js 20 LTS + Fastify 4 + Prisma ORM
- Frontend: React 18 + Vite (SPA, no Next.js)
- Base de datos: PostgreSQL 15
- Cache / cola virtual / rate limit / sesiones: Redis 7
- Tiempo real: WebSocket (@fastify/websocket) con heartbeat 15-20 s
- Scheduler de jobs: BullMQ sobre Redis
- Auth: JWT (jose) + argon2 (hash PIN) + otplib (OTP)
- Contenedores: Docker + Docker Compose (api, web, postgres, redis)
- Repositorio: https://github.com/HitLP38/ComedorUni

## Decisiones de diseño cerradas (2026-04-19)

- Dos servicios diarios: ALMUERZO (reservas abren 6:00 AM) y CENA (reservas abren 2:00 PM). Configurables por admin.
- Turnos del almuerzo: 11:30, 12:00, 12:30, 13:00, 13:30, 14:00 (30 min c/u, cupo por defecto 50, ajustable por admin).
- Identidad: carnet SUNEDU con código de barras contiene el código de alumno UNI (8 dígitos).
- Registro: código alumno + nombres + DNI + correo UNI + facultad. Sin OCR, sin ficha de matrícula subida.
- Validación cruzada: algoritmo DNI + algoritmo código alumno + formato correo n1.A1.A2@uni.pe + enlace de confirmación TTL 24 h.
- Autenticación: DNI + PIN 6 dígitos + OTP al correo UNI (2FA real).
- Sesiones: token de cola al entrar (con heartbeat), token de reserva TTL 5 min al salir de la cola, hold de cupo 60 s al seleccionar turno.
- Cola virtual: Redis Sorted Set por servicio/día, WebSocket push, worker que libera N usuarios por ventana.
- Plan B lector barras: input manual de código de alumno o DNI en el dashboard del operador del comedor.
- Estados del ticket: PENDIENTE, ACTIVO/RESERVADO, VALIDADO/CONSUMIDO, EXPIRADO, CANCELADO, NO_SHOW.
- Cancelación voluntaria permitida hasta 30 min antes del turno.
- No-shows: job al cierre del servicio los marca. Ventana deslizante de 30 días. 2 → advertencia, 3 → suspensión 7 días, 5 acumulados → suspensión con petición manual. Admin separado puede anular no-shows con justificación.
- Constraint crítico BD: UNIQUE(codigo_alumno, fecha, servicio).
- Rate limiting: por IP y por DNI, bloqueo exponencial, CAPTCHA al tercer intento fallido.

## Avances documentales (monografía)

Capítulos entregados (fases 1 y 2): Resumen, Introducción, Marcos teórico y conceptual (cola virtual, concurrencia, grafos, Big-O), Grupo objetivo, Definición del proyecto, EDT, Cronograma, Recursos, Presupuesto, Riesgos.

Avances internos de fase 3 (pendientes de volcar al docx final por el usuario). Ubicación a partir del 2026-04-19: carpeta `Avances/` en la raíz del proyecto.

- `Avances/mono_Avance1_Requerimientos.md` — Sección 3.1 completa (3.1.1 funcionales RF-01 a RF-12, 3.1.2 no funcionales RNF-01 a RNF-10, 3.1.3 detallados RD-01 a RD-14). Redactado en APA 7 con citas integradas al marco teórico existente. Creado 2026-04-19.
- `referencias.md` (sigue en raíz) — Bibliografía consolidada APA 7. Incluye las referencias previas del marco teórico más las nuevas de ISO 29148, ISO 25010, Sommerville, Pressman, NIST, OWASP, RFC 6238, RFC 8446, WCAG 2.1, Knuth, Silberschatz, Saltzer & Schroeder, Microsoft Azure Architecture Center.

Próximo entregable esperado según EDT y cronograma: fase 3.2 Diseño (3.2.1 diseño funcional, 3.2.2 diseño del sistema, 3.2.3 diseño de interfaz) del 23 al 26 de abril. Archivo propuesto: `mono_Avance2_Diseño.md`.

## Convención de archivos

- `Monografía.md` (raíz): documento principal de redacción APA 7 (el usuario lo edita manualmente).
- `Avances/mono_AvanceN_NombreSeccion.md`: archivos con texto de cada nueva sección que el usuario pega luego al docx final. TODOS los avances van dentro de la carpeta `Avances/`.
- `referencias.md` (raíz): acumulado de referencias APA 7 usadas en la monografía.
- `Documentos/`: insumos de apoyo (EDT.md, etc.).
- `Proyecto/`: carpeta para código del sistema (aún no creada).
- `.gitignore`: reglas de ignorado preparadas para stack Node + React + Postgres + Redis + Docker.
