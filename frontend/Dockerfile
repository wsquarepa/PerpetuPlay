FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM alpine:latest
WORKDIR /app/dist
COPY --from=builder /app/dist .
RUN chmod -R 755 /app/dist
CMD ["echo", "Exiting Gracefully - Build already exported."]
