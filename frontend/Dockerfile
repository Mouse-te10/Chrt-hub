# Использовать официальный образ Node.js
FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем зависимости проекта
RUN npm install

# Копируем весь остальной код фронтенда
COPY . .

# Открываем порт Vite наружу
EXPOSE 5173

# Запускаем Vite с флагом --host, чтобы Docker мог пробросить порт в сеть
CMD ["npm", "run", "dev", "--", "--host"]
