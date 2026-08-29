# Root Dockerfile for Complaint Management System Backend
FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

EXPOSE 3000

CMD ["npm", "start"]
