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
| Payment Service (đặt cọc) | `payment-service/` | 8086 |
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
cd payment-service && mvn spring-boot:run
```

Auth, customer và order dùng API `/api/v1`; car và inventory cung cấp API quản
trị tại `/api/v1/admin`. Các collection Postman nằm trong `postman/`.

## Chạy frontend

```bash
cp .env.example .env.local
npm install
npm run dev
```

Frontend gọi các backend qua API Gateway/Nginx bằng các biến
`NEXT_PUBLIC_*_API_URL` trong `.env.local`. `NEXT_PUBLIC_USE_BACKEND_SERVICES`
mặc định là `true`; frontend tự gắn JWT và chuyển đổi response DTO của Spring
Boot sang kiểu dữ liệu giao diện.

Các luồng chưa có backend tương ứng (danh mục xe công khai, lái thử,
OTP/quên mật khẩu) vẫn dùng mock API tại `/api`. Luồng đặt cọc thật tạo order
qua Order Service, tạo intent và xác nhận qua Payment Service; sau khi confirm,
Order Service chuyển trạng thái sang `DEPOSIT_PAID`. Người dùng cần đăng nhập
trước khi đặt cọc.
Khi cần chạy hoàn toàn bằng mock, đặt
`NEXT_PUBLIC_USE_BACKEND_SERVICES=false`.

## Chạy toàn bộ bằng Docker

Yêu cầu Docker Engine và Docker Compose:

```bash
docker compose up --build
```

Sau khi khởi động:

- Frontend: `http://localhost:3000`
- API Gateway (Nginx): `http://localhost:8080`
- MySQL: `localhost:3307` (container nội bộ vẫn dùng `mysql:3306`)

Các backend service chỉ truy cập trong Docker network; frontend chỉ gọi API
Gateway tại cổng `8080`.

MySQL tự chạy schema và seed trong `database/` ở lần khởi tạo volume đầu tiên.
Muốn khởi tạo lại database từ đầu, dùng `docker compose down -v` rồi chạy lại
`docker compose up --build`.

## Công nghệ

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS
- Backend: Spring Boot, Spring Data JPA, JWT
- Database: MySQL 8, InnoDB, utf8mb4

## CI/CD với Jenkins

Jenkins chạy bằng Docker, build/test 6 service + frontend, push image lên
Docker Hub và deploy lên EC2 bằng Docker Compose.

```bash
export DOCKER_GID=$(stat -c '%g' /var/run/docker.sock)
docker compose -f docker-compose.jenkins.yml up -d --build
# UI: http://localhost:9090
```

Danh sách file, cách tạo credential/job và troubleshooting:
[`docs/CI_JENKINS.md`](./docs/CI_JENKINS.md).

Trạng thái thật của từng luồng (chạy thật hay còn mock) và việc còn lại:
[`docs/PROJECT_STATUS.md`](./docs/PROJECT_STATUS.md).
