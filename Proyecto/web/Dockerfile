# ============================================
# React + Vite - Desarrollo
# ============================================
FROM node:20-alpine

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./
COPY index.html ./

# Instalar todas las dependencias (dev + prod)
RUN npm install

# Copiar código fuente
COPY src ./src/

# Exponer puerto
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/ || exit 1

# Comando de inicio (usa Vite dev server)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]