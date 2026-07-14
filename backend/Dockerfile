FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy remaining source code
COPY . .

# Expose backend API port
EXPOSE 3001

# Run backend service
CMD ["node", "index.js"]
