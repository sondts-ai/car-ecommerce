# Car E-commerce

Hệ thống thương mại điện tử bán ô tô gồm frontend Next.js và các backend
Spring Boot theo kiến trúc microservices.

## Cấu trúc repository

| Thành phần | Thư mục | Cổng mặc định |
|---|---|---:|
| Frontend khách hàng | `app/`, `components/`, `lib/` | 3000 |
| Auth Service | `auth-service/` | 8081 |
| Customer Service | `customer-service/` | 8082 |
| Order Service | `order-service/` | 8083 |
| Car Service (admin) | `car-service/` | 8084 |
| Inventory Service (admin) | `inventory-service/` | 8085 |
| Database scripts | `database/` | — |

## Chạy backend

Yêu cầu Java 17+, Maven và MySQL 8. Chạy các schema/seed trong
[`database/README.md`](./database/README.md), sau đó cấu hình `JWT_SECRET` và
thông tin kết nối database theo README của từng service.

```bash
cd auth-service && mvn spring-boot:run
cd customer-service && mvn spring-boot:run
cd order-service && mvn spring-boot:run
cd car-service && mvn spring-boot:run
cd inventory-service && mvn spring-boot:run
```

Auth, customer và order dùng API `/api/v1`; car và inventory cung cấp API quản
trị tại `/api/v1/admin`. Các collection Postman nằm trong `postman/`.

## Chạy frontend

```bash
cp .env.example .env.local
npm install
npm run dev
```

Mặc định frontend dùng mock API tại `/api` để toàn bộ giao diện chạy độc lập.
Để gọi backend thật, đặt `NEXT_PUBLIC_USE_MOCK_API=false` và
`NEXT_PUBLIC_API_BASE_URL` tới API gateway/reverse proxy có định tuyến các
service backend. Các endpoint backend hiện có được mô tả trong README của
`auth-service`, `customer-service`, `order-service`, `car-service` và
`inventory-service`; các luồng thanh toán, đặt cọc và lái thử vẫn dùng mock cho
đến khi có service tương ứng.

## Công nghệ

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Spring Boot, Spring Data JPA, JWT
- Database: MySQL 8, InnoDB, utf8mb4
