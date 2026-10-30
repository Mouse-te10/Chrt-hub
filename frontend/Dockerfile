# Этап 1: Сборка проекта
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Этап 2: Раздача через Nginx
FROM nginx:alpine
# Копируем собранный фронтенд в папку Nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Копируем твой настроенный nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

