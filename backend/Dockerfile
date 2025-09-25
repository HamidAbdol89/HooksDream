FROM node:20-alpine

WORKDIR /app

# Copy package.json
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ code hiện tại
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
