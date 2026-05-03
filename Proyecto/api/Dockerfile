# ============================================
# API Fastify - Desarrollo
# ============================================
FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (dev + prod)
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente
COPY src ./src/

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Comando de inicio (usa npm run dev con tsx watch)
CMD ["npm", "run", "dev"]