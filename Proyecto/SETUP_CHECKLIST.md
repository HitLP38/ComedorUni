# ✅ Checklist de Verificación del Setup

Antes de continuar con implementación de handlers, verifica que la infraestructura está lista.

---

## 🔧 Paso 1: Preparar el Entorno

- [ ] Node.js 20+ instalado: `node --version`
- [ ] Docker Desktop iniciado y corriendo
- [ ] Git instalado: `git --version`
- [ ] Carpeta `Proyecto/` descargada o creada
- [ ] Archivo `.env` creado desde `.env.example`

---

## 🐳 Paso 2: Iniciar Docker Compose

```bash
cd Proyecto
docker-compose up
```

Espera a ver estos logs (puede tomar 2-3 minutos):

```
postgres_1  | database system is ready to accept connections
redis_1     | Ready to accept connections
api_1       | ✓ Conectado a Redis
api_1       | 🚀 RanchUNI API iniciado en 0.0.0.0:3001
web_1       | VITE v5.0.8  ready in 123 ms
web_1       | ➜  Local:   http://localhost:5173/
```

**Marcar cuando veas estos logs**: [ ]

---

## ✅ Paso 3: Verificar Servicios (en otra terminal)

### Frontend
```bash
curl http://localhost:5173
```
Esperado: HTML con título "RanchUNI"

- [ ] Frontend accesible

### API - Health
```bash
curl http://localhost:3001/health
```
Esperado:
```json
{
  "status": "ok",
  "timestamp": "2026-05-03T...",
  "environment": "development"
}
```

- [ ] API health OK

### API - Database
```bash
curl http://localhost:3001/health/db
```
Esperado:
```json
{
  "status": "ok",
  "database": "postgresql",
  "timestamp": "2026-05-03T..."
}
```

- [ ] Base de datos OK

### API - Redis
```bash
curl http://localhost:3001/health/redis
```
Esperado:
```json
{
  "status": "ok",
  "cache": "redis",
  "timestamp": "2026-05-03T..."
}
```

- [ ] Redis OK

---

## 🌐 Paso 4: Acceso a Navegador

Abre: http://localhost:5173

Deberías ver:
- Encabezado granate con "🍽️ RanchUNI"
- Contenido de bienvenida
- Sección de estado de conexiones
- Sección de próximos pasos

- [ ] Frontend renderiza correctamente

---

## 📊 Paso 5: Verificar Base de Datos (Opcional)

Si instalaste `psql`:

```bash
psql -h localhost -U comedoruni_user -d comedoruni -c "\dt"
```

Deberías ver lista vacía (sin tablas aún):

```
Did not find any relations.
```

- [ ] Acceso a BD OK

---

## 📝 Checklist Final

- [ ] Node.js y Docker instalados
- [ ] `.env` configurado con secretos
- [ ] `docker-compose up` ejecutándose sin errores
- [ ] Frontend accesible en http://localhost:5173
- [ ] API responde en http://localhost:3001/health
- [ ] BD conectada (`/health/db` retorna ok)
- [ ] Redis conectado (`/health/redis` retorna ok)

**Si todas las casillas están marcadas**, escribe en chat:

```
✅ Setup verificado completamente
```

Y continuaremos con **OPCIÓN B: Implementar Primeros Handlers de Autenticación**.

---

## 🆘 Troubleshooting

### Error: "Docker daemon not running"
→ Abre Docker Desktop desde tu computadora

### Error: "Port 3001 already in use"
→ Ejecuta: `lsof -i :3001` (macOS/Linux) o `netstat -ano | findstr :3001` (Windows)
→ Luego mata el proceso o cambia puerto en `docker-compose.yml`

### Error: "Cannot connect to PostgreSQL"
→ Espera 30 segundos más, BD puede tardar en iniciar
→ Verifica logs: `docker-compose logs postgres`

### Frontend no carga en http://localhost:5173
→ Verifica: `docker-compose logs web`
→ Asegúrate que no hay otro servicio en puerto 5173

### "ECONNREFUSED" en llamadas HTTP
→ Asegúrate que docker-compose está corriendo: `docker-compose ps`
→ Debería mostrar 5 contenedores en estado "Up"

---

**Una vez todo verificado, aviso en chat y pasamos a OPCIÓN B** 🚀
