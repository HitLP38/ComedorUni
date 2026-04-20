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

- `Avances/mono_Avance1_Requerimientos.md` — Sección 3.1 completa (3.1.1 funcionales RF-01 a RF-12, 3.1.2 no funcionales RNF-01 a RNF-10, 3.1.3 detallados RD-01 a RD-14). Creado 2026-04-19.
- `Avances/mono_Avance2_Diseño.md` — Sección 3.2 completa. 3.2.1 funcional: 3 actores, 18 casos de uso en 5 subsistemas, 4 CU críticos descritos (UC07, UC13, UC15, UC16), máquina de estados del ticket (PENDIENTE→ACTIVO→CONSUMIDO/CANCELADO/EXPIRADO/NO_SHOW) y flujo de solicitudes. 3.2.2 sistema: arquitectura por capas (React/Fastify/Postgres/Redis/BullMQ/WS), ER con 7 entidades, secuencia de reserva en cola virtual, secuencia de validación con plan B manual, concurrencia (SELECT FOR UPDATE + UNIQUE) y seguridad (TLS 1.3 + argon2 + OTP + rate limit). 3.2.3 interfaz: 4 principios (Nielsen, Norman, consistencia, WCAG), paleta UNI, mapa de navegación, descripción detallada de 13 pantallas. Incluye 8 diagramas Mermaid en español con párrafo descriptivo paralelo. Creado 2026-04-19.
- `Avances/Diseño_mockups/index.html` v0.2 — Catálogo visual de 13 pantallas (11 mobile + 2 desktop): Landing, Registro, Login Yape, Home alumno (cuadrícula), Cola virtual, Selección turno, Confirmación (con barcode alumno), Mi código, Mis datos, Sanciones, Solicitudes, Panel operador, Dashboard admin. Paleta granate/dorado/crema, Inter, logo UNI embebido.
- `referencias.md` — Sumadas en Avance 2: Booch/Rumbaugh/Jacobson (UML), Chen (ER), Cockburn (casos de uso), Fowler (patrones arquitectura), Krug (usabilidad web), Nielsen (usabilidad), Norman (diseño de objetos cotidianos).
- `Documentos/skill_mermaid-uni-es_SKILL.md` — Contenido del skill `mermaid-uni-es` con convenciones para diagramas Mermaid en español y paleta UNI. Pendiente de instalación manual del usuario en carpeta de skills.

Próximo entregable esperado según EDT y cronograma: fase 3.3 Construcción (setup monorepo, Docker Compose, esqueletos Fastify y React+Vite, primeras iteraciones). El código vivirá en `Proyecto/` (aún no creada).

## Convención de archivos

- `Monografía.md` (raíz): documento principal de redacción APA 7 (el usuario lo edita manualmente).
- `Avances/mono_AvanceN_NombreSeccion.md`: archivos con texto de cada nueva sección que el usuario pega luego al docx final. TODOS los avances van dentro de la carpeta `Avances/`.
- `referencias.md` (raíz): acumulado de referencias APA 7 usadas en la monografía.
- `Documentos/`: insumos de apoyo (EDT.md, etc.).
- `Proyecto/`: carpeta para código del sistema (aún no creada).
- `.gitignore`: reglas de ignorado preparadas para stack Node + React + Postgres + Redis + Docker.
