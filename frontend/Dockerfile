# Stage 1: Base image with shared dependencies
FROM node:24-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Stage 2: Local development setup with HMR
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 3: Production build (Injects API URL at build time)
FROM base AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY . .
RUN npm run build

# Stage 4: Lean production image using Vite Preview
FROM node:24-slim AS production
WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/package*.json ./

COPY --from=build /app/vite.config.ts ./

RUN npm install --omit=dev && npm install vite

EXPOSE 3000 10000

CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port ${PORT:-3000}"]
