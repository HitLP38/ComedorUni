# RanchUNI - Sistema de Gestión de Turnos de Comedor

Aplicación web de gestión y emisión de tickets de turno para el comedor universitario de la UNI.

**Curso**: Taller de Efectividad Personal (HU501-U)  
**Docente**: Felipe Tsutomu Hiromoto Hiromoto  
**Ciclo**: 26-1  
**Repositorio**: https://github.com/HitLP38/ComedorUni

---

## 📋 Requisitos Previos

- **Node.js 20 LTS** - [Descargar](https://nodejs.org/)
- **Docker Desktop** - [Descargar](https://www.docker.com/products/docker-desktop)
- **Git** - [Descargar](https://git-scm.com/)

Verifica que están instalados:

```bash
node --version  # debe ser v20.x.x
docker --version
git --version
```

---

## 🚀 Inicio Rápido (Desarrollo)

### 1. Clonar repositorio

```bash
git clone https://github.com/HitLP38/ComedorUni.git
cd ComedorUni/Proyecto
```

### 2. Crear archivo `.env`

```bash
cp .env.example .env
```

Edita `.env` y configura variables críticas (JWT_SECRET, SMTP, Google reCAPTCHA):

```
JWT_SECRET="tu-clave-secreta-random-aqui"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-contraseña-app-gmail"
```

### 3. Iniciar contenedores

```bash
docker-compose up
```

Espera a que todos los servicios estén listos. Verás logs similares a:

```
✓ Conectado a Redis
✓ API iniciado en 0.0.0.0:3001
```

### 4. Verificar servicios

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001/health
- **Base de Datos**: `localhost:5432` (credenciales en `.env`)
- **Cache**: `localhost:6379`

---

## 📁 Estructura de Directorios

```
Proyecto/
├── api/                    # Backend Fastify
│   ├── src/
│   │   ├── index.ts       # Bootstrap de aplicación
│   │   ├── services/      # Lógica de negocio
│   │   ├── handlers/      # Endpoints HTTP
│   │   ├── middleware/    # Middleware de seguridad
│   │   └── utils/         # Utilidades
│   ├── prisma/
│   │   └── schema.prisma  # Modelo de datos
│   ├── __tests__/         # Pruebas unitarias
│   ├── Dockerfile
│   └── package.json
├── web/                    # Frontend React+Vite
│   ├── src/
│   │   ├── main.tsx       # Entry point
│   │   ├── App.tsx        # Componente raíz
│   │   ├── components/    # Componentes React
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── store/         # Estado global
│   │   └── api/           # Cliente HTTP
│   ├── index.html
│   ├── Dockerfile
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml      # Orquestación de servicios
├── .env.example
└── README.md
```

---

## 🔧 Comandos Útiles

### Backend

```bash
cd api

# Desarrollo con hot-reload
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar pruebas
npm run test
npm run test:watch

# Gestionar base de datos
npx prisma migrate dev    # Crear/ejecutar migraciones
npx prisma studio        # Interfaz de Prisma
npx prisma seed          # Datos de prueba
```

### Frontend

```bash
cd web

# Desarrollo con hot-reload
npm run dev

# Compilar para producción
npm run build

# Preview de build
npm run preview

# Pruebas
npm run test
npm run test:watch
```

### Docker

```bash
# Iniciar todos los servicios
docker-compose up

# Iniciar en background
docker-compose up -d

# Ver logs
docker-compose logs -f api
docker-compose logs -f web

# Detener servicios
docker-compose down

# Remover todo (incluido datos)
docker-compose down -v
```

---

## 📚 Stack Tecnológico

### Backend

- **Fastify 4** - Framework HTTP rápido
- **Prisma ORM** - Acceso a BD
- **PostgreSQL 15** - Base de datos
- **Redis 7** - Cache y cola virtual
- **JWT (jose)** - Autenticación
- **Argon2** - Hash de contraseñas
- **BullMQ** - Jobs asincronos

### Frontend

- **React 18** - Framework UI
- **Vite** - Bundler y dev server
- **React Router 6** - Enrutamiento
- **Zustand** - Gestión de estado
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos

---

## 🔐 Seguridad (Configuración Inicial)

El sistema implementa:

✅ **Autenticación 2FA**: DNI + PIN + OTP por correo  
✅ **CORS restrictivo**: Solo origen permitido en `.env`  
✅ **Encabezados HTTP**: HSTS, CSP, X-Frame-Options  
✅ **Rate limiting**: Por IP y usuario  
✅ **Validación de entrada**: Zod schemas  
✅ **reCAPTCHA v3**: Detección de bots  

Para habilitar completamente, configura en `.env`:

```
GOOGLE_RECAPTCHA_SECRET=tu-clave-google-recaptcha
SMTP_USER=tu-email-para-otp
SMTP_PASSWORD=contraseña-app-email
```

---

## 📖 Documentación

- **Monografía completa**: `/Avances/mono_Avance*.md`
  - Seguridad (3.5)
  - Módulos (3.3.1)
  - Interfaz (3.3.2)
  - Codificación (3.3.3)
  - Testing (3.4)

- **Referencias APA 7**: `/referencias.md`

---

## 🧪 Testing

```bash
# Backend: Pruebas unitarias
cd api && npm run test

# Frontend: Pruebas de componentes
cd web && npm run test

# Cobertura de código
npm run test:coverage
```

---

## 📊 Próximos Pasos

1. ✅ Setup inicial (COMPLETADO)
2. Implementar handlers de autenticación (`POST /auth/login`, `POST /auth/otp`)
3. Implementar servicios de cola virtual
4. Crear componentes React (Landing, Login, Home, Queue)
5. Implementar WebSocket para cola en tiempo real
6. Pruebas de integración y E2E
7. Deployment en producción

---

## 🤝 Contribuir

Este es un proyecto académico del Taller de Efectividad Personal de UNI.

Para cambios:

1. Crear rama: `git checkout -b feature/nombre-feature`
2. Hacer cambios
3. Commit: `git commit -am 'Agregar feature'`
4. Push: `git push origin feature/nombre-feature`
5. Crear Pull Request

---

## 📝 Licencia

MIT

---

## 📧 Contacto

**Desarrollador**: Raul  
**Email**: raul2011svn@gmail.com  
**GitHub**: https://github.com/HitLP38/ComedorUni

---

**Última actualización**: 2 de Mayo de 2026
