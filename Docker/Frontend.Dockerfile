FROM node:22
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
COPY frontend/.env ./
EXPOSE 3000
CMD ["npm", "start"]