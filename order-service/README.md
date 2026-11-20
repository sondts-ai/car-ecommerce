# Order Service

Independent Spring Boot service backed only by `order_db`. It validates the Auth-issued JWT locally (same `JWT_SECRET`, `JWT_ISSUER`, `userId`, `role`, signed-token expiry) and calls Customer Service REST `GET /api/v1/customers/me` to resolve the owning `customer_id`. No `auth_db` or `customer_db` repositories/entities are used.

## Implemented APIs

Every route requires `Authorization: Bearer <Auth JWT>` with role `CUSTOMER`.

| Method | URL | Behavior |
|---|---|---|
| GET | `/api/v1/me/cart` | Resolves customer, returns active cart; creates an empty active cart if missing |
| DELETE | `/api/v1/me/cart/items/{vehicleId}` | Removes that vehicle ID from the caller's active cart |
| DELETE | `/api/v1/me/cart/items` | Removes all items from the caller's active cart |
| GET | `/api/v1/me/orders` | Lists only orders whose `customer_id` matches Customer Service identity |
| GET | `/api/v1/me/orders/{orderId}` | Reads an owned order and its item snapshots |
| GET | `/api/v1/me/orders/{orderId}/history` | Reads status history after verifying order ownership |

All order reads filter by both `order_id` and verified `customer_id`; a foreign or nonexistent order returns 404. Customer IDs come from Customer Service REST and are never accepted from the request body. Auth or Customer Service outages return 503/502 rather than falling back to a client-supplied ID.

## Explicit dependencies / deferred operations

The inspected project contains no vehicle API or module. Therefore this service does not add cart items and does not create deposit orders or reservations yet. Those writes require a vehicle source to validate availability and provide the `vehicle_name`, VIN, and price snapshots required by `order_items`. No API contract is guessed and `vehicle_db` is never accessed.

The schema has no quantity column in `cart_items`; cart item quantity is not supported. `vehicle_reservations` requires an expiry value but no hold duration/configuration is specified, so no reservation is created and no expiration duration is invented. There are no order-state update APIs. This customer-facing service exposes reads only and cannot mark an order paid. No payment integration is present.

## Database

Applies the existing `database/order_db/schema.sql` from `car-ecommerce-main.zip` manually before startup. Hibernate is `ddl-auto: validate`; this service does not create or alter schema. It maps carts, cart items, orders, order items and status history. Reservation writes remain deferred with vehicle validation/hold policy.

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
6. Cart add, deposit order creation and reservation race checks cannot be exercised until a vehicle data REST API and hold-duration policy are supplied.
