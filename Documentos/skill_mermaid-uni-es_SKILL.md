---
name: mermaid-uni-es
description: "diagramas Mermaid en español con convenciones académicas UNI (granate/dorado) para monografía RanchUNI y otros proyectos UNI."
---

Todos los diagramas Mermaid deben escribirse en español: etiquetas de actores, estados, relaciones, notas y títulos. Evitar inglés salvo tecnicismos intraducibles (API, JWT, WebSocket, CRUD, CAPTCHA, OTP).

Cada diagrama va como bloque ```mermaid dentro del .md y se acompaña de un párrafo descriptivo (2-5 oraciones) para que el documento final en docx conserve la información aunque el renderizador Mermaid falle.

Usar la paleta UNI para styling cuando Mermaid lo permita: granate `#7B1E23`, granate oscuro `#5E1418`, dorado `#D4A84B`, crema `#F5EDE0`, texto `#1F2937`. Para fondos claros preferir `#F5EDE0`. Para estados críticos usar rojo `#DC2626`.

Convenciones de nombres: actores en PascalCase español (Alumno, Operador, Admin). Casos de uso como verbos en infinitivo (Registrar cuenta, Reservar turno, Validar ticket). Estados en mayúsculas con guion bajo (PENDIENTE, ACTIVO, CONSUMIDO, EXPIRADO, CANCELADO, NO_SHOW). Entidades de BD en singular PascalCase (Alumno, Ticket, Servicio, Turno).

Plantilla de casos de uso (graph TB con subgraph por sistema):
```mermaid
graph TB
  subgraph Sistema["Sistema RanchUNI"]
    UC1(Registrar cuenta)
    UC2(Reservar turno)
    UC3(Validar ticket)
  end
  Alumno((Alumno)) --> UC1
  Alumno --> UC2
  Operador((Operador)) --> UC3
```

Plantilla de máquina de estados (stateDiagram-v2):
```mermaid
stateDiagram-v2
  [*] --> PENDIENTE
  PENDIENTE --> ACTIVO: reserva confirmada
  ACTIVO --> CONSUMIDO: validación en comedor
  ACTIVO --> CANCELADO: cancelación voluntaria
  ACTIVO --> NO_SHOW: cierre de servicio sin consumo
  CONSUMIDO --> [*]
  CANCELADO --> [*]
  NO_SHOW --> [*]
```

Plantilla de arquitectura por capas (graph LR con estilos):
```mermaid
graph LR
  Cliente[Cliente React SPA]
  API[API Fastify]
  DB[(PostgreSQL)]
  Cache[(Redis)]
  Cola[BullMQ workers]
  Cliente -->|HTTPS + WS| API
  API --> DB
  API --> Cache
  Cache --> Cola
  classDef core fill:#7B1E23,color:#fff;
  class API core;
```

Plantilla ER (erDiagram):
```mermaid
erDiagram
  ALUMNO ||--o{ TICKET : reserva
  SERVICIO ||--o{ TURNO : contiene
  TURNO ||--o{ TICKET : acoge
  ALUMNO {
    int id PK
    string codigo_alumno UK
    string dni UK
    string correo_uni UK
  }
  TICKET {
    int id PK
    int alumno_id FK
    int turno_id FK
    date fecha
    string estado
  }
```

Plantilla de secuencia (sequenceDiagram):
```mermaid
sequenceDiagram
  actor A as Alumno
  participant W as Cliente Web
  participant API as API Fastify
  participant R as Redis
  participant DB as PostgreSQL
  A->>W: abre app
  W->>API: autenticar (DNI+PIN)
  API->>DB: validar credenciales
  API-->>W: token JWT
  W->>R: ingresar a cola
  R-->>W: posición
```

Plantilla de flujo/actividad (graph TD):
```mermaid
graph TD
  Inicio([Inicio]) --> Dato[/Datos del alumno/]
  Dato --> Val{¿Datos válidos?}
  Val -->|Sí| Guard[Registrar solicitud]
  Val -->|No| Err[Mostrar error]
  Guard --> Fin([Fin])
  Err --> Fin
```

Reglas duras al generar diagramas para monografía:
- Nunca escribir nombres de archivos de código, clases JavaScript/Python ni sintaxis de lenguajes de programación dentro de los nodos. La monografía no lleva código.
- Los nombres técnicos de tecnologías (Fastify, Prisma, BullMQ, JWT) sí se pueden mencionar en nodos de arquitectura porque son nombres propios del producto/estándar.
- Etiquetas de flechas y transiciones siempre en español.
- Máximo 12 nodos por diagrama para mantener legibilidad en una página A4 vertical.
- Si un diagrama necesita más de 12 nodos, dividirlo en dos con títulos distintos.

Cada bloque Mermaid debe acompañarse, en la misma sección del .md, de un párrafo que describa el diagrama en prosa académica: qué representa, qué actores o elementos participan, y qué conclusión operativa se extrae. Este párrafo es el que sobrevivirá en el docx final incluso si el usuario decide no exportar la imagen del diagrama.
