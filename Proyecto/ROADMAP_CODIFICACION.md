# Roadmap de Codificación RanchUNI — Prompts para Claude Code

Lista de prompts secuenciales para llevar el proyecto desde el estado actual (docker-compose levantando contenedores con healthchecks) hasta una aplicación corriendo de punta a punta: registro, login, reserva, validación en comedor, panel admin y tests.

**Cómo usar este archivo:**

1. Abre Claude Code dentro de la carpeta `Proyecto/` (`cd Proyecto && claude`).
2. Copia el prompt del bloque que quieras trabajar (de B0 a B13).
3. Pégalo en Claude Code y deja que ejecute. Verifica el resultado con los criterios de aceptación al final de cada bloque.
4. No saltes bloques: el orden respeta dependencias técnicas y el EDT (3.3.1 → 3.3.2 → 3.3.3 → 3.4).
5. Después de cada bloque verde, haz commit (los prompts ya incluyen el `git commit` sugerido).

**Convenciones que aplican a TODOS los prompts:**

- Sigue el stack ya decidido en `CLAUDE.md` (Fastify 4, Prisma, React 18 + Vite, Postgres 15, Redis 7).
- Lenguaje: TypeScript estricto en api/ y web/.
- Seguridad: nunca registres PIN, OTP, tokens ni DNI en logs.
- Validación de entrada con Zod en todos los endpoints.
- Errores: respuesta JSON `{ error: { code, message, details? } }` con código HTTP correcto.
- Tests obligatorios para cada service nuevo (Vitest).
- Commits en español, formato Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).

---

## B0 — Cierre de setup (git + migración + seed)

```text
Contexto: Proyecto RanchUNI, monografía UNI. Lee CLAUDE.md y SETUP_CHECKLIST.md antes de empezar.

Estado actual: docker-compose up funciona, healthchecks responden, pero la base de datos está vacía (no hay migración aplicada) y el repositorio git no está inicializado.

Tareas:

1. Inicializa git en la raíz Proyecto/. Crea .gitignore que excluya node_modules/, dist/, .env (sí mantén .env.example), coverage/, .DS_Store, *.log, prisma/migrations/dev.db.

2. Crea api/prisma/seed.ts que:
   - Inserta Servicio ALMUERZO (apertura 06:00, cierre 14:00, duracion 30) y CENA (apertura 14:00, cierre 19:00, duracion 30).
   - Inserta los 6 turnos de almuerzo para los próximos 7 días: 11:30, 12:00, 12:30, 13:00, 13:30, 14:00, todos con cupo_maximo=50, cupo_actual=0, estado=ABIERTO.
   - Es idempotente (usa upsert).
   - Configura "prisma": { "seed": "ts-node prisma/seed.ts" } en api/package.json.

3. Aplica la migración inicial dentro del contenedor:
   - docker-compose exec api npx prisma migrate dev --name init
   - docker-compose exec api npx prisma db seed

4. Verifica con curl http://localhost:3001/health/db que sigue ok y que las tablas existen (psql o prisma studio).

5. Primer commit: "chore: setup inicial de scaffolding api+web+docker con migración Prisma y seed de servicios".

6. Crea el repo remoto si no existe (https://github.com/HitLP38/ComedorUni). Push de la rama main.

Entregable verificado: docker-compose up arranca, /health/db responde ok, las tablas alumnos, servicios, turnos, tickets, sanciones, otp_codes, logs_acceso existen, hay 2 servicios y 42 turnos sembrados (6 horarios x 7 días), todo está commiteado en main del repo remoto.
```

---

## B1 — Estructura modular de la API (EDT 3.3.1)

```text
Contexto: Lee CLAUDE.md. La API actualmente es un único archivo api/src/index.ts. Vamos a modularizar antes de agregar lógica de negocio.

Tareas:

Crea la siguiente estructura dentro de api/src/, con archivos vacíos o con stub mínimo:

api/src/
├── index.ts                    (bootstrap fastify, registra plugins y rutas)
├── config/
│   ├── env.ts                  (parsea y valida process.env con Zod, exporta config tipada)
│   └── constants.ts            (constantes de negocio: TTL_TICKET_MIN=5, HOLD_CUPO_SEG=60, etc.)
├── lib/
│   ├── prisma.ts               (singleton PrismaClient)
│   ├── redis.ts                (singleton redis client)
│   ├── logger.ts               (instancia pino con redacción de campos sensibles)
│   ├── jwt.ts                  (firmar/verificar JWT con jose)
│   ├── crypto.ts               (hash/verify PIN con argon2, generar OTP con otplib)
│   └── mailer.ts               (interfaz IMailer + impl mock que escribe a archivo en dev)
├── plugins/
│   ├── auth.ts                 (decorador fastify.authenticate y fastify.authenticateAdmin)
│   ├── rateLimit.ts            (rate limit por IP y por DNI, con escalado exponencial)
│   ├── errorHandler.ts         (handler global, mapea ZodError, PrismaError, AppError → JSON)
│   └── prismaPlugin.ts         (decora fastify con instancia prisma)
├── errors/
│   └── AppError.ts             (clase AppError con code, statusCode, message, details)
├── schemas/                    (schemas Zod compartidos entre rutas y servicios)
│   ├── auth.schema.ts
│   ├── reserva.schema.ts
│   └── admin.schema.ts
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts      (registra rutas /auth/*)
│   │   ├── auth.service.ts     (lógica de negocio)
│   │   ├── auth.repository.ts  (acceso a BD via prisma)
│   │   └── auth.dto.ts         (tipos de entrada/salida)
│   ├── reserva/
│   │   ├── reserva.routes.ts
│   │   ├── reserva.service.ts
│   │   ├── reserva.repository.ts
│   │   └── reserva.dto.ts
│   ├── cola/
│   │   ├── cola.routes.ts      (incluye WS /ws/cola)
│   │   ├── cola.service.ts     (gestiona Sorted Set Redis)
│   │   └── cola.worker.ts      (libera N usuarios por ventana)
│   ├── ticket/
│   │   ├── ticket.routes.ts
│   │   ├── ticket.service.ts
│   │   └── ticket.repository.ts
│   ├── sancion/
│   │   ├── sancion.routes.ts
│   │   ├── sancion.service.ts
│   │   └── sancion.worker.ts   (job que marca NO_SHOW al cierre)
│   └── admin/
│       ├── admin.routes.ts
│       └── admin.service.ts
├── jobs/
│   ├── queue.ts                (BullMQ queues setup)
│   └── workers.ts              (registro de workers)
└── types/
    └── fastify.d.ts            (extiende FastifyInstance y FastifyRequest con decoradores)

Mueve la lógica actual de index.ts (helmet, cors, healthchecks) a sus lugares correspondientes:
- helmet/cors → plugins separados o en el bootstrap
- healthchecks → modules/health/health.routes.ts

Cada archivo nuevo debe exportar al menos un stub funcional (función vacía con tipos correctos, no archivos vacíos). El proyecto debe seguir compilando con tsc --noEmit y arrancando con docker-compose up.

Commit: "refactor(api): modularización en plugins, modules y lib según EDT 3.3.1".

Entregable: estructura completa creada, tsc --noEmit pasa sin errores, docker-compose up arranca y /health sigue respondiendo ok.
```

---

## B2 — Infraestructura compartida (plugins, errores, validación)

```text
Contexto: Lee CLAUDE.md y la estructura modular ya creada en B1.

Implementa los plugins y utilidades compartidas con código real (no stubs):

1. config/env.ts: schema Zod para todas las variables de entorno (DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_EXPIRES_IN, OTP_SECRET, ARGON2_MEMORY, etc.). Lanza error claro si falta alguna.

2. lib/prisma.ts: singleton PrismaClient con shutdown hook.

3. lib/redis.ts: singleton client de redis con reconnect strategy.

4. lib/logger.ts: pino con redact: ['req.headers.authorization', 'pin', 'pin_hash', 'codigo', 'dni', 'token', '*.pin', '*.dni'].

5. lib/jwt.ts: signAccessToken(payload, ttl), signRefreshToken, verifyToken. Usa jose.

6. lib/crypto.ts:
   - hashPin(pin: string): Promise<string> con argon2id (memoryCost 65536, timeCost 3).
   - verifyPin(pin, hash): Promise<boolean>.
   - generateOTP(): string de 6 dígitos numéricos con crypto.randomInt.
   - generateTicketCode(): UUID v4.

7. lib/mailer.ts: interfaz IMailer { send(to, subject, body) }. Impl MockMailer que escribe a /tmp/ranchuni-mails/<timestamp>.eml. En prod luego se cambia por SMTP.

8. errors/AppError.ts: clase AppError extends Error con code (ej: 'AUTH_INVALID_PIN'), statusCode, message, details?.

9. plugins/errorHandler.ts: hook onError global que:
   - ZodError → 400 con details de campos.
   - AppError → statusCode con su shape.
   - PrismaClientKnownRequestError P2002 → 409 conflicto.
   - Cualquier otro → 500 sin filtrar mensaje en prod.

10. plugins/auth.ts: decorador request.authenticate() que valida JWT del header Authorization y carga request.user. Usar fastify-plugin para que los decoradores estén disponibles globalmente.

11. plugins/rateLimit.ts: usa @fastify/rate-limit por IP (10 req/min global) más un guard adicional por DNI en endpoints de auth (5 intentos/15min con escalado: 1m, 5m, 15m, 1h al fallar, reseteado en login exitoso). CAPTCHA placeholder a partir del 3er intento.

12. modules/health/health.routes.ts: mueve los healthchecks aquí.

13. Tests Vitest para crypto.ts (hashPin produce verify=true, hashes diferentes para mismo input por sal, generateOTP con length=6 y solo dígitos) y AppError.

Commit: "feat(api): infraestructura compartida (logger, jwt, crypto, plugins, errores)".

Entregable: docker-compose up arranca, /health sigue ok, tests de crypto y errors pasan, los plugins están registrados en el bootstrap.
```

---

## B3 — Auth: Registro y verificación de correo (RF-01, RF-03)

```text
Contexto: Lee CLAUDE.md, mono_Avance1_Requerimientos.md (RF-01 y RF-03) y la estructura ya creada.

Implementa el flujo de registro:

Endpoints:

POST /auth/registro
- body: { codigo_alumno, dni, nombres_apellidos, correo_uni, facultad, pin }
- Valida con Zod:
  - codigo_alumno: 8 dígitos exactos.
  - dni: 8 dígitos, algoritmo de validación peruano (último dígito).
  - correo_uni: formato n1.A1.A2@uni.pe (regex: ^[a-z]\.[a-z]+\.[a-z]+@uni\.pe$).
  - pin: 6 dígitos numéricos exactos (no consecutivos como 123456 ni repetidos como 111111).
  - facultad: enum válido (lista de facultades UNI).
- Si ya existe un alumno con ese codigo_alumno, dni o correo_uni → 409.
- Crea Alumno con estado=ACTIVO pero sin pin_hash todavía. Genera token de verificación (UUID + TTL 24h, almacenado en redis con clave verif:<token>).
- Envía correo (vía mailer mock) con link http://localhost:5173/verificar/<token>.
- Hashea PIN y guarda pin_hash en el registro.
- Responde 201 { mensaje: "Revisa tu correo UNI para confirmar tu cuenta." }.
- Loggea evento REGISTRO_INICIO en logs_acceso.

GET /auth/verificar/:token
- Lee token de redis. Si no existe o expiró → 410 Gone.
- Marca el alumno como verificado (campo correo_verificado: Boolean en schema, agregarlo).
- Borra token de redis.
- Loggea REGISTRO_VERIFICACION.
- Responde 200 { mensaje: "Cuenta verificada. Ya puedes iniciar sesión." }.

Cambios al schema Prisma:
- Alumno: agrega correo_verificado Boolean @default(false).
- Crea migración: docker-compose exec api npx prisma migrate dev --name agregar_verificacion_correo.

Tests Vitest (auth.service.test.ts):
- Registro exitoso crea Alumno con correo_verificado=false.
- Registro con DNI inválido lanza AppError AUTH_DNI_INVALIDO.
- Registro con correo en formato no UNI lanza AppError AUTH_CORREO_NO_UNI.
- Registro duplicado por codigo_alumno lanza AppError AUTH_ALUMNO_DUPLICADO.
- Verificación con token válido marca correo_verificado=true.
- Verificación con token expirado lanza AppError AUTH_TOKEN_EXPIRADO.

Commit: "feat(auth): registro y verificación de correo UNI (RF-01, RF-03)".

Entregable: curl POST /auth/registro con body válido devuelve 201, mock-mailer escribe el .eml, GET /auth/verificar/<token> responde 200, tests pasan.
```

---

## B4 — Auth: Login con DNI + PIN + OTP 2FA (RF-02)

```text
Contexto: Lee CLAUDE.md y RF-02 en mono_Avance1_Requerimientos.md.

Implementa el flujo 2FA completo:

POST /auth/login
- body: { dni, pin }
- Validaciones: alumno existe, correo_verificado=true, no está suspendido (estado != SUSPENDIDO_*), verifyPin pasa.
- Si pasa: genera OTP de 6 dígitos, guarda OTPCode con timestamp_expiracion = now + 5min, intentos_fallidos=0.
- Envía OTP al correo_uni del alumno.
- Responde 200 { challenge_id: <id de OTPCode>, mensaje: "Revisa tu correo UNI, el código expira en 5 minutos." }.
- Si DNI no existe o PIN incorrecto: AppError AUTH_CREDENCIALES_INVALIDAS (mensaje genérico para no filtrar info), incrementa contador del rate-limiter por DNI.
- Loggea LOGIN_FALLIDO o nada (esperar OTP).

POST /auth/verificar-otp
- body: { challenge_id, codigo }
- Busca OTPCode. Si consumido=true o expirado → AppError.
- Si codigo no coincide: incrementa intentos_fallidos. Al llegar a 3 → marca consumido=true (bloqueo) y obliga a login de nuevo.
- Si coincide: marca consumido=true, emite accessToken (TTL 30min) y refreshToken (TTL 7d, almacenado en redis con clave refresh:<jti>). Responde 200 { accessToken, refreshToken, alumno: { id, codigo_alumno, nombres_apellidos } }. Loggea LOGIN_EXITOSO.

POST /auth/refresh
- body: { refreshToken }
- Verifica firma y que jti existe en redis. Emite nuevo accessToken (rotación de refresh: borra el viejo, emite uno nuevo).

POST /auth/logout
- Requiere autenticación. Borra refreshToken de redis. Responde 204.

POST /auth/cambiar-pin
- Requiere autenticación. body: { pin_actual, pin_nuevo }. Verifica pin_actual, hashea pin_nuevo, actualiza. Loggea CAMBIO_PIN.

Tests:
- Login con credenciales válidas devuelve challenge_id, no devuelve token aún.
- Login con PIN incorrecto incrementa contador, al 3er intento bloquea por 1 min.
- Verificar OTP correcto en ventana válida devuelve tokens.
- Verificar OTP expirado lanza AppError AUTH_OTP_EXPIRADO.
- Verificar OTP incorrecto 3 veces marca consumido y obliga reintentar login.
- Refresh con token válido emite nuevo access.
- Refresh con token revocado falla.

Commit: "feat(auth): login DNI+PIN con OTP 2FA y refresh tokens (RF-02)".

Entregable: flujo completo login → OTP → tokens funciona vía curl/postman, tests pasan, mock-mailer registra OTP.
```

---

## B5 — Cola virtual con Redis Sorted Set y WebSocket (RF-04)

```text
Contexto: Lee CLAUDE.md, sección "Cola virtual" del marco teórico y RF-04.

Implementa la cola de espera:

Diseño:
- Sorted Set Redis: cola:<servicio>:<fecha> con miembro=alumno_id, score=timestamp_entrada (epoch ms).
- Hash Redis sesion_cola:<token_cola> con { alumno_id, servicio, fecha, posicion_inicial, ts_entrada } TTL 30 min.
- Heartbeat cada 15-20s desde el cliente WS, si no llega en 30s se expulsa de la cola.
- Worker (cola.worker.ts) que cada 10s lee los primeros N de la cola (N configurable, por defecto 5 cada 30s) y a cada uno emite WS evento "tu_turno" con un token de reserva de TTL 5 min, removiéndolos de la sorted set y registrando LogAcceso QUEUE_LIBERATION.

Endpoints REST:

POST /cola/entrar
- Requiere autenticación.
- body: { servicio: 'ALMUERZO'|'CENA' }.
- Valida que el alumno no esté suspendido y que no tenga ya un ticket ACTIVO o CONSUMIDO ese día/servicio.
- Valida que la cola esté abierta (entre hora_apertura_reserva y hora_cierre_reserva).
- Genera token_cola (UUID), agrega al sorted set, crea sesion_cola hash.
- Responde 200 { token_cola, posicion, ws_url: "ws://localhost:3001/ws/cola" }.

DELETE /cola/salir
- body: { token_cola }. Remueve del sorted set y borra hash. Responde 204.

GET /cola/posicion
- query: { token_cola }. Devuelve { posicion, total, eta_segundos }.

WebSocket /ws/cola
- Conexión inicial con token_cola en query string.
- Server emite cada 5s: { tipo: 'posicion', posicion, total }.
- Cliente debe enviar { tipo: 'heartbeat' } cada 15s; si no llega en 30s se expulsa.
- Cuando es liberado: server emite { tipo: 'tu_turno', token_reserva, ttl_segundos: 300 } y cierra el socket.

Worker (cola.worker.ts):
- Loop cada 10s: por cada (servicio, fecha) con cola activa, pop los primeros N por score, emite tu_turno via canal pub/sub redis (que el handler WS escucha) y guarda token_reserva:<uuid> en redis con TTL 300s y { alumno_id, servicio, fecha }.

Tests:
- Entrar a la cola devuelve posicion=1 si está vacía.
- Entrar dos veces con el mismo alumno responde error AUTH_YA_EN_COLA.
- Worker libera N alumnos correctamente y emite tu_turno via pub/sub.
- Salir de la cola decrementa el total.

Commit: "feat(cola): cola virtual Redis SS + WS heartbeat + worker liberación (RF-04)".

Entregable: dos clientes ws con tokens distintos ven sus posiciones actualizándose, el worker libera al primero, el segundo pasa a posicion=1.
```

---

## B6 — Reservas y emisión de tickets (RF-05, RF-06, RF-07)

```text
Contexto: Lee CLAUDE.md y RF-05 a RF-07.

Implementa el flujo de reserva:

GET /turnos
- query: { servicio, fecha (YYYY-MM-DD) }.
- Devuelve [{ id, hora_inicio, cupo_disponible, estado }] para ese servicio/fecha. cupo_disponible = cupo_maximo - cupo_actual - holds_activos. Solo turnos con estado=ABIERTO.

POST /reservas/hold
- Requiere token_reserva (recibido vía WS desde la cola, TTL 5min).
- body: { token_reserva, turno_id }.
- Verifica que token_reserva existe en redis y corresponde al alumno, servicio y fecha del turno.
- Si turno tiene cupo_disponible > 0: crea hold:<turno_id>:<alumno_id> en redis con TTL 60s y valor 1. Decrementa cupo_disponible vía sumar al contador hold_count:<turno_id>. Responde 200 { hold_id, ttl_segundos: 60 }.
- Usa transacción Redis (MULTI/EXEC) o Lua script para evitar oversell.

POST /reservas/confirmar
- body: { token_reserva, turno_id }.
- Verifica hold activo del alumno para ese turno.
- En transacción Prisma: crea Ticket (codigo_ticket=UUID, estado=ACTIVO, timestamp_expiracion=fin del turno + 30min), incrementa cupo_actual del Turno, libera hold en redis, consume token_reserva.
- Constraint UNIQUE(alumno_id, fecha, turno_id) ya está en el schema.
- Responde 201 { ticket: { id, codigo_ticket, fecha, hora_inicio, qr_data } }. qr_data es codigo_ticket (el front lo renderiza a QR).
- Loggea RESERVA_CREADA.

GET /reservas/mias
- Requiere autenticación. Devuelve los tickets del alumno con estado IN ('ACTIVO','CONSUMIDO','NO_SHOW') últimos 30 días.

DELETE /reservas/:id
- Requiere autenticación. Solo si: ticket pertenece al alumno, estado=ACTIVO, faltan más de 30 minutos para hora_inicio.
- Cambia estado a CANCELADO, decrementa cupo_actual.

Tests:
- Hold respeta cupo_maximo (10 holds concurrentes en turno con cupo 5 → solo 5 ganan).
- Confirmar dos veces el mismo turno para el mismo alumno falla por UNIQUE.
- Cancelación dentro de la ventana de 30 min antes falla.
- Cancelación válida libera cupo.

Commit: "feat(reserva): hold de cupo + emisión de ticket + cancelación (RF-05/06/07)".

Entregable: end-to-end desde la cola → tu_turno → hold → confirmar → ticket con QR funciona.
```

---

## B7 — Validación en comedor: dashboard del operador (RF-08, RF-09)

```text
Contexto: Lee CLAUDE.md y RF-08, RF-09 (lector de barras + plan B manual).

Implementa el rol Operador:

Modelo nuevo en schema Prisma:
- Operador { id, usuario, password_hash, nombres, activo, fecha_creacion }.
- Migración correspondiente.
- Seed de un operador inicial (usuario "operador1" / pwd "Cambiar123!" hasheado).

Auth operador:
POST /operador/login
- body: { usuario, password }.
- Sin OTP (ambiente físico). Devuelve accessToken con role=OPERADOR. TTL corto (8h, una jornada).

POST /operador/validar
- Requiere autenticación con role=OPERADOR.
- body: uno de { codigo_ticket } | { codigo_alumno } | { dni }.
- Caso codigo_ticket: busca Ticket por codigo, valida estado=ACTIVO, hora actual dentro de [hora_inicio, hora_inicio+duracion]. Marca CONSUMIDO, timestamp_validacion=now. Loggea TICKET_VALIDADO.
- Caso codigo_alumno o dni: busca el ticket ACTIVO del alumno para hoy en la ventana de tiempo actual. Si hay uno, valida igual. Si hay 0 → error. Si hay >1 → error (no debería pasar por UNIQUE).
- Responde 200 { ticket_validado: true, alumno: { codigo, nombres }, turno: { hora_inicio } } o 4xx con razón clara (ticket ya consumido, fuera de ventana, no existe, alumno suspendido).

POST /operador/logout
- Invalida token (similar a B4).

Tests:
- Validar ticket activo en ventana → CONSUMIDO.
- Validar ticket fuera de ventana → AppError TICKET_FUERA_DE_VENTANA.
- Validar ticket ya consumido → AppError TICKET_YA_CONSUMIDO.
- Validar por DNI cuando hay un solo ACTIVO funciona.

Commit: "feat(operador): validación de tickets vía código, DNI o código alumno (RF-08, RF-09)".

Entregable: operador puede loguearse, escanear (input manual) y consumir un ticket; el alumno ve estado CONSUMIDO en /reservas/mias.
```

---

## B8 — Sanciones automáticas y job de cierre (RF-10, RF-11)

```text
Contexto: Lee CLAUDE.md y RF-10, RF-11 sobre no-shows y suspensiones.

Implementa el sistema de sanciones:

Job BullMQ: cierre-servicio
- Schedule: corre 30 minutos después de la hora_cierre_reserva de cada servicio diariamente (cron en prod, en dev ejecutable manualmente).
- Para cada Ticket con estado=ACTIVO y fecha=hoy y turno cuya hora_inicio+duracion ya pasó: marca estado=NO_SHOW.
- Por cada NO_SHOW marcado, llama a SancionService.evaluarAlumno(alumno_id).

SancionService.evaluarAlumno(alumno_id):
- Cuenta los NO_SHOW del alumno en los últimos 30 días.
- 2 NO_SHOW → crea Sancion(tipo=ADVERTENCIA), no bloquea.
- 3 NO_SHOW → crea Sancion(tipo=SUSPENSION_7D, fecha_levantamiento=now+7d), actualiza Alumno.estado=SUSPENDIDO_7D y fecha_suspension_hasta.
- 5 NO_SHOW acumulados (vida del alumno, no ventana) → Sancion(tipo=SUSPENSION_MANUAL), Alumno.estado=SUSPENDIDO_MANUAL (solo admin puede levantar).
- Loggea SANCION_APLICADA.

Job BullMQ: levantar-suspension
- Corre cada hora. Por cada Alumno con estado=SUSPENDIDO_7D y fecha_suspension_hasta < now: vuelve a ACTIVO, marca Sancion como resuelta=true.

Endpoints admin (placeholder, se completa en B9):
POST /admin/anular-sancion
- body: { sancion_id, justificacion }.
- Marca resuelta=true, fecha_levantamiento=now. Si era SUSPENSION_*, devuelve Alumno a ACTIVO. Loggea con detalles_json.

Tests:
- Job marca NO_SHOW correctamente sólo a tickets ACTIVO con turno terminado.
- 2 NO_SHOW genera ADVERTENCIA pero no bloquea.
- 3 NO_SHOW en ventana de 30d genera SUSPENSION_7D y bloquea login (en B4 agregar el check de estado).
- Job de levantamiento devuelve alumno a ACTIVO cuando vence.

Commit: "feat(sancion): job no-show + ventana 30d + suspensiones (RF-10, RF-11)".

Entregable: ejecutar manualmente el job y observar tickets pasando a NO_SHOW y sanciones aplicándose; el flujo de login bloquea a los suspendidos.
```

---

## B9 — Panel de administración (RF-12)

```text
Contexto: Lee CLAUDE.md y RF-12.

Modelo nuevo:
- Administrador { id, usuario, password_hash, nombres, activo }. Migración + seed (usuario "admin", pwd "Admin12345!").

Auth admin: POST /admin/login (similar a operador, role=ADMIN), POST /admin/logout.

Endpoints (todos requieren role=ADMIN):

GET /admin/servicios
PATCH /admin/servicios/:id  (cambiar hora_apertura_reserva, hora_cierre_reserva, activo)

GET /admin/turnos?fecha=YYYY-MM-DD
PATCH /admin/turnos/:id  (cambiar cupo_maximo, estado)
POST /admin/turnos/regenerar?fecha=YYYY-MM-DD  (regenera turnos por defecto si fueron borrados)

GET /admin/alumnos?estado=&q=  (paginado, q busca por dni/codigo/correo)
GET /admin/alumnos/:id  (detalle: tickets, sanciones, logs últimos 30d)
PATCH /admin/alumnos/:id/estado  (admin puede ACTIVO o SUSPENDIDO_MANUAL con razón)

GET /admin/sanciones?activas=true
POST /admin/sanciones/:id/anular  (delegado a B8)

GET /admin/reportes/uso?desde=&hasta=
- Devuelve métricas: total tickets emitidos, consumidos, no-shows, top facultades, ocupación promedio por turno. JSON listo para graficar.

GET /admin/logs?tipo_evento=&desde=&hasta=  (paginado).

Tests para los endpoints más críticos (cambiar cupo, suspender alumno, anular sanción).

Commit: "feat(admin): panel de configuración, alumnos, sanciones y reportes (RF-12)".

Entregable: admin puede ver y modificar servicios/turnos/alumnos vía API.
```

---

## B10 — Frontend React: Auth + reserva (alumno)

```text
Contexto: Lee CLAUDE.md y mono_Avance2_Diseño.md (sección 3.2.3 diseño de interfaz) y mono_Avance2b_CatalogoMockups.md.

Stack frontend:
- React 18 + Vite + TypeScript estricto.
- Router: react-router-dom v6.
- Estado servidor: @tanstack/react-query.
- Estado cliente: Zustand para session (token + alumno actual).
- HTTP: axios con interceptor que adjunta Authorization, manejo de 401 → refresh.
- Estilos: CSS modules + variables globales (paleta granate UNI #800020 / dorado #FFB800).
- Validación de formularios: react-hook-form + zod.
- WS: nativo, hook useColaWebSocket.
- QR: qrcode.react.

Estructura web/src/:
src/
├── main.tsx
├── App.tsx                 (RouterProvider)
├── routes/
│   ├── routes.tsx          (definición rutas)
│   └── ProtectedRoute.tsx  (HOC verifica session)
├── pages/
│   ├── Login.tsx
│   ├── VerificarOTP.tsx
│   ├── Registro.tsx
│   ├── VerificarCorreo.tsx
│   ├── Dashboard.tsx       (home alumno)
│   ├── ColaEspera.tsx
│   ├── SeleccionTurno.tsx
│   ├── MiTicket.tsx        (muestra QR del ticket)
│   ├── MisReservas.tsx
│   └── CambiarPin.tsx
├── components/
│   ├── Layout.tsx
│   ├── Header.tsx
│   ├── PinInput.tsx        (6 dígitos, autoavance)
│   ├── TurnoCard.tsx
│   ├── TicketQR.tsx
│   ├── PosicionCola.tsx
│   └── Toast.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useColaWebSocket.ts
│   ├── useTurnos.ts
│   └── useTickets.ts
├── api/
│   ├── client.ts           (axios)
│   ├── auth.api.ts
│   ├── reserva.api.ts
│   └── cola.api.ts
├── stores/
│   └── sessionStore.ts     (Zustand)
└── styles/
    ├── tokens.css          (variables granate/dorado/typografía)
    └── global.css

Flujos:

1. Registro → VerificarCorreo (espera click en link del .eml mock).
2. Login (DNI + PIN) → VerificarOTP (input 6 dígitos, countdown 5min) → Dashboard.
3. Dashboard: 2 cards "Reservar almuerzo" / "Reservar cena" (la disponible según hora del día) + botón "Mis reservas".
4. Click reservar → ColaEspera (abre WS, muestra "Posición X de Y", spinner). Al recibir tu_turno → navigate a SeleccionTurno con token_reserva.
5. SeleccionTurno: lista turnos con cupo disponible. Click en turno → POST hold (60s countdown visible) → POST confirmar → MiTicket.
6. MiTicket: QR grande con codigo_ticket, datos del alumno y turno, botón "Cancelar reserva" (si faltan >30 min).
7. MisReservas: histórico últimos 30d.

Diseño:
- Mobile-first (la mayoría de alumnos usan celular).
- Encabezado granate UNI con logo, nombre del usuario y avatar inicial. Botón cerrar sesión.
- Botones grandes accesibles (WCAG 2.1 AA, contraste >=4.5:1).
- Mensajes de error claros en español.
- Loading states con skeletons.

Tests con Vitest + Testing Library: PinInput, ProtectedRoute, formulario de Login.

Commit: "feat(web): frontend de alumno (auth, cola, reserva, ticket)".

Entregable: end-to-end desde el navegador http://localhost:5173: registro → verificar correo → login → OTP → cola → seleccionar turno → ver ticket con QR.
```

---

## B11 — Frontend operador y admin

```text
Contexto: Lee CLAUDE.md y los mockups en mono_Avance2b_CatalogoMockups.md.

Subdominio de rutas (web/src/pages/operador/ y web/src/pages/admin/):

Operador:
- /operador/login
- /operador/validar (input grande: pegar codigo_ticket / codigo_alumno / dni; lectura via input nativo desde lector de barras USB que actúa como teclado y termina con Enter; al Enter, POST /operador/validar y muestra resultado destacado verde/rojo). Auto-focus permanente al input. Sonido beep en éxito y error.
- /operador/historial (últimos 50 validaciones del turno actual).

Admin:
- /admin/login
- /admin/dashboard (KPIs: tickets hoy, consumidos, no-shows, % ocupación, gráfico recharts).
- /admin/servicios (tabla editable con horarios y activo).
- /admin/turnos?fecha= (tabla por día, editar cupo).
- /admin/alumnos (búsqueda + paginado + detalle).
- /admin/sanciones (lista activas + anular con justificación).
- /admin/reportes (rango de fechas + gráficos uso).

Reutiliza Layout, Header (con role-aware menu), client axios.

Tests del componente principal de validación operador.

Commit: "feat(web): paneles de operador y administrador".

Entregable: tres flujos completos visibles en navegador (alumno, operador, admin).
```

---

## B12 — Tests integración + E2E

```text
Contexto: Lee CLAUDE.md, sección 3.4 del EDT.

1. Tests integración API (api/test/integration/):
   - Usar Testcontainers o docker-compose.test.yml con Postgres y Redis aislados.
   - supertest contra la app Fastify.
   - Casos: registro completo (con verificación de correo), login completo (con OTP leído del mock-mailer), reserva completa (cola → hold → confirmar), validación operador, sanción tras 3 no-shows.
   - Setup/teardown limpia BD entre tests.

2. Tests E2E (web/e2e/) con Playwright:
   - Levanta docker-compose y corre playwright test.
   - Escenarios: feliz (registro→reserva→ticket), error (PIN incorrecto 3 veces), cancelación.
   - Captura screenshots para evidencia en monografía.

3. CI: archivo .github/workflows/ci.yml que en cada PR:
   - lint (eslint en api y web).
   - tsc --noEmit.
   - vitest run en api y web.
   - levanta servicios y corre tests integración.
   - reporta cobertura.

Commit: "test: integración API + E2E Playwright + CI GitHub Actions".

Entregable: CI verde, screenshots E2E generadas en web/e2e/screenshots/.
```

---

## B13 — Hardening, README y demo final

```text
Contexto: Lee CLAUDE.md.

1. Configura HTTPS local con mkcert para api y web.
2. CSP estricta en nginx del front.
3. Agrega métricas básicas /metrics (Prometheus format) en la API.
4. Logs estructurados con request_id correlado entre API y workers.
5. README.md raíz del repo con:
   - Diagrama arquitectura (puede ser ascii o mermaid).
   - Instrucciones setup desde cero (clone → cp .env.example .env → docker compose up → migrate → seed → abrir 5173).
   - Credenciales de prueba (admin, operador, un alumno seed).
   - Tabla de endpoints REST con request/response.
   - Lista de tests y cómo correrlos.
   - Variables de entorno requeridas.
6. Crea un seed de demo con 10 alumnos ficticios para que la presentación tenga datos.
7. Genera 1 video corto (con ttygif o similar) o 6-8 screenshots clave del flujo, guardados en docs/demo/.
8. Tag v1.0.0 en git con mensaje "Entrega final RanchUNI - HU501-U 26-1" y push.

Commit: "docs: README final + métricas + hardening + tag v1.0.0".

Entregable: clonar el repo en una máquina nueva, seguir el README, y en menos de 10 minutos tener la aplicación funcionando con datos demo.
```

---

## Estimación de esfuerzo (orientativa)

| Bloque | Estimación | Qué bloquea |
|--------|-----------|-------------|
| B0 | 1-2 h | Todo lo demás |
| B1 | 2-3 h | B2 a B9 |
| B2 | 4-6 h | B3 en adelante |
| B3 | 4-5 h | B4 |
| B4 | 4-6 h | B5, B6 |
| B5 | 6-8 h | B6 |
| B6 | 5-7 h | B7 |
| B7 | 3-4 h | B8 |
| B8 | 4-5 h | (paralelo con B9) |
| B9 | 4-6 h | B11 |
| B10 | 8-12 h | B11 |
| B11 | 6-8 h | B12 |
| B12 | 6-8 h | B13 |
| B13 | 3-4 h | — |

**Total**: ~60-85 horas de trabajo enfocado. Distribuido en sesiones de 2-3 h se traduce en ~3-4 semanas.

---

## Notas para alinear con la monografía

Cada bloque que termines (especialmente B1, B2, B5, B6, B8, B12) genera material que debe volcarse a un `mono_AvanceN_*.md` correspondiente, según el EDT:

- B1 + B2 → `mono_Avance3_DefinicionModulos.md` (EDT 3.3.1).
- Contratos de endpoints (consolidado al terminar B6) → `mono_Avance3_DefinicionInterfaz.md` (EDT 3.3.2).
- Codificación implementada (consolidado al terminar B9) → `mono_Avance3_CodificacionPrograma.md` (EDT 3.3.3) — ya existe parcialmente como `mono_Avance3_Codificacion.md`.
- B12 → `mono_Avance3_Tests.md` (EDT 3.4).
- B13 → `mono_Avance4_EntregaFinal.md` (EDT 4) — ya existe parcialmente.

Al final pídeme generar los `.md` documentales por bloque cuando hayas avanzado el código, así separamos la redacción APA 7 del trabajo de codificación.
