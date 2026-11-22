FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# NEXT_PUBLIC_* là biến build-time của Next.js: phải truyền vào lúc build,
# không phải lúc chạy container. CI/CD truyền các giá trị này qua --build-arg.
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_API_TIMEOUT=15000
ARG NEXT_PUBLIC_USE_MOCK_API=true
ARG NEXT_PUBLIC_USE_BACKEND_SERVICES=true
ARG NEXT_PUBLIC_AUTH_API_URL=http://localhost:8081/api/v1
ARG NEXT_PUBLIC_CUSTOMER_API_URL=http://localhost:8082/api/v1
ARG NEXT_PUBLIC_ORDER_API_URL=http://localhost:8083/api/v1
ARG NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:8086/api/v1

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_API_TIMEOUT=$NEXT_PUBLIC_API_TIMEOUT \
    NEXT_PUBLIC_USE_MOCK_API=$NEXT_PUBLIC_USE_MOCK_API \
    NEXT_PUBLIC_USE_BACKEND_SERVICES=$NEXT_PUBLIC_USE_BACKEND_SERVICES \
    NEXT_PUBLIC_AUTH_API_URL=$NEXT_PUBLIC_AUTH_API_URL \
    NEXT_PUBLIC_CUSTOMER_API_URL=$NEXT_PUBLIC_CUSTOMER_API_URL \
    NEXT_PUBLIC_ORDER_API_URL=$NEXT_PUBLIC_ORDER_API_URL \
    NEXT_PUBLIC_PAYMENT_API_URL=$NEXT_PUBLIC_PAYMENT_API_URL

RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.mjs ./

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "run", "start"]
