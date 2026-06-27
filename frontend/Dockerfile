# Etapa 1: Build do React
FROM node:20-alpine AS builder
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./
RUN npm install

# Copia todo o conteúdo do frontend (src, public, configs, etc.)
COPY . .

# Gera o build do React (vai criar /app/build)
RUN npm run build

# Etapa 2: Nginx serve o build estático
FROM nginx:alpine

# Copia o build para a pasta padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5000
