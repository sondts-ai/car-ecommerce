# Customer Service

Independent Spring Boot service for `customer_db`. It does not read `auth_db` or any other service database. Hibernate is configured with `ddl-auto: validate`, so it will validate the supplied schema rather than create or alter tables.

## Endpoints

All endpoints require `Authorization: Bearer <JWT from Auth Service>` and the `CUSTOMER` role.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/customers/me` | Profile plus Auth account identity (fetched from Auth REST API) |
| POST | `/api/v1/customers/me` | Create the authenticated user's missing profile |
| PUT | `/api/v1/customers/me` | Update name, birthday, gender |
| GET | `/api/v1/customers/me/addresses` | List own addresses |
| GET | `/api/v1/customers/me/addresses/default` | Get own default address |
| POST | `/api/v1/customers/me/addresses` | Add an address |
| PUT | `/api/v1/customers/me/addresses/{id}` | Update an owned address |
| DELETE | `/api/v1/customers/me/addresses/{id}` | Delete an owned address |
| PUT | `/api/v1/customers/me/addresses/{id}/default` | Set an owned address as default |

Profile phone is owned by Auth (`users.phone`), not `customers`; the current Auth API has no phone-update endpoint. The profile response includes phone and email read from `GET /api/v1/auth/me`. Address phone remains editable as part of the address book.

The Customer JWT verifier follows Auth's current JJWT token: same HS key from `JWT_SECRET`, issuer from `JWT_ISSUER` (default `car-sales-auth`), signed token, `userId`, `role=CUSTOMER`, and expiry. Profile GET/creation additionally forwards the token to Auth `/me`, which checks the account's current status. Auth REST failures map to 401/502/503. Address/profile update operations rely on the signed token; as with any stateless access token, status changes are rechecked when Auth `/me` is called.

## Run

1. Apply the existing `database/customer_db/schema.sql` (and optional seed) from `car-ecommerce-main.zip` to MySQL manually.
2. Set `CUSTOMER_DB_URL`, `CUSTOMER_DB_USERNAME`, `CUSTOMER_DB_PASSWORD`, and the same `JWT_SECRET` / `JWT_ISSUER` used by Auth. Set `AUTH_SERVICE_URL` if Auth is not at `http://localhost:8081`.
3. From this directory run `mvn spring-boot:run`. Default port: `8082`.

Run unit tests with `mvn test`. A Postman collection is at `postman/Customer-Service.postman_collection.json` (workspace root).

## Reviews

The inspected `customer_db` schema has no review table. Review API is not implemented and the database is unchanged. `proposals/reviews_schema.sql` is an unapplied proposal only; it uses a logical vehicle ID and an internal FK to customers.
