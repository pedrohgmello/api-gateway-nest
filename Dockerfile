## Building Stage

FROM node:alpine AS build
WORKDIR /app
COPY ./package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Production Stage

FROM node:alpine AS production
WORKDIR /app
COPY ./package*.json ./
RUN npm ci --omit=dev
ENV NODE_DEV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]