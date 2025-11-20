FROM node:22
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
#Express, Hocuspocus port
EXPOSE 5000 6001
CMD ["node", "app.js"]
