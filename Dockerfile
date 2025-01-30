# Use a full Debian-based image instead of Alpine for better Puppeteer support
FROM node:18-bullseye-slim

# 1) Install Chromium and required dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxtst6 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 2) Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 3) Create working directory inside the container
WORKDIR /app

# 4) Copy dependencies and install
COPY package*.json ./
RUN npm install --omit=dev

# 5) Copy the rest of the app
COPY . .

# 6) Start the application
CMD ["npm", "start"]
