# Order Service

Independent Spring Boot service backed only by `order_db`. It validates the Auth-issued JWT locally (same `JWT_SECRET`, `JWT_ISSUER`, `userId`, `role`, signed-token expiry) and calls Customer Service REST `GET /api/v1/customers/me` to resolve the owning `customer_id`. No `auth_db` or `customer_db` repositories/entities are used.

## Implemented APIs

Every route requires `Authorization: Bearer <Auth JWT>` with role `CUSTOMER`.

| Method | URL | Behavior |
|---|---|---|
| POST | `/api/v1/me/orders` | Creates a `PENDING_DEPOSIT` order + item snapshot; rejects deposit > total |
| GET | `/api/v1/me/cart` | Resolves customer, returns active cart; creates an empty active cart if missing |
| DELETE | `/api/v1/me/cart/items/{vehicleId}` | Removes that vehicle ID from the caller's active cart |
| DELETE | `/api/v1/me/cart/items` | Removes all items from the caller's active cart |
| GET | `/api/v1/me/orders` | Lists only orders whose `customer_id` matches Customer Service identity |
| GET | `/api/v1/me/orders/{orderId}` | Reads an owned order and its item snapshots |
| GET | `/api/v1/me/orders/{orderId}/history` | Reads status history after verifying order ownership |
| POST | `/api/v1/me/internal/orders/{orderId}/deposit-paid` | Internal only (`X-Internal-Key`, not routed by Nginx); Payment Service calls it after a successful payment |

All order reads filter by both `order_id` and verified `customer_id`; a foreign or nonexistent order returns 404. Customer IDs come from Customer Service REST and are never accepted from the request body. Auth or Customer Service outages return 503/502 rather than falling back to a client-supplied ID.

## Explicit dependencies / deferred operations

`POST /me/orders` currently trusts the item snapshot sent by the caller (`vehicleId`, `vehicleName`, `vin`, `price`). There is no Vehicle/Inventory REST client yet, so availability is **not** validated and no row is inserted into `vehicle_reservations`; `reserved_until` is stored on the order only as an informational value.

Not implemented:

- Adding items to the cart (only read/remove/clear exist); `cart_items` has no quantity column.
- Vehicle availability check / hold / reservation expiry job (`vehicle_reservations` table is unused).
- Order cancellation and automatic expiry of unpaid deposits.
- Order ownership check on Payment Service: it calls `deposit-paid` with the internal key, but Payment Service itself has no JWT authentication yet.

## Database

Applies the existing `database/order_db/schema.sql` from `car-ecommerce-main.zip` manually before startup. Hibernate is `ddl-auto: validate`; this service does not create or alter schema. It maps carts, cart items, orders, order items and status history. Reservation writes remain deferred until an inventory API and hold policy are agreed.

## Run

Set `ORDER_DB_URL`, `ORDER_DB_USERNAME`, `ORDER_DB_PASSWORD`, the same `JWT_SECRET` and `JWT_ISSUER` as Auth, and `CUSTOMER_SERVICE_URL` (default `http://localhost:8082`). Customer Service must be running and the signed-in account must have a Customer profile.

From this directory:

```powershell
mvn spring-boot:run
```

Default port is `8083`. Run unit tests with `mvn test`. The Postman collection at `postman/Order-Service.postman_collection.json` is at workspace root.

## Postman setup and expected behavior

1. Call Auth `POST /api/v1/auth/login`; set the returned token as `customerToken` in the Order collection.
2. Ensure the account has a profile in Customer Service; configure `customerBaseUrl` and obtain another customer's token for ownership checks.
3. `GET /api/v1/me/cart` returns an empty or existing cart. `DELETE` item returns 404 if that ID is absent; clear returns the number removed.
4. Order list/detail/history return persisted data only. Detail/history for an order owned by another customer returns 404.
5. Requests without a token or with an invalid/expired token return 401. A non-CUSTOMER token is rejected.
6. `POST /api/v1/me/orders` creates a deposit order from the supplied snapshot. Reservation race checks cannot be exercised until a vehicle/inventory API and hold-duration policy are supplied.
