# Customer Service

Independent Spring Boot service for `customer_db`. It does not read `auth_db` or any other service database. Hibernate is configured with `ddl-auto: validate`, so it will validate the supplied schema rather than create or alter tables.

## Endpoints

`GET`, `POST`, and customer cancellation for `/api/v1/test-drives` require a `CUSTOMER` JWT; customers can see and manage only appointments associated with their user ID. Slot lookup is public. The admin test-drive endpoints require an `ADMIN` JWT. Other customer endpoints continue to require a `CUSTOMER` JWT.

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
| GET | `/api/v1/test-drives` | List only the authenticated customer's appointments (`data.items`) |
| POST | `/api/v1/test-drives` | Create a tracked appointment; requires `hasLicense: true` |
| DELETE | `/api/v1/test-drives/{id}` | Cancel an owned pending or confirmed appointment |
| GET | `/api/v1/test-drives/slots?carSlug=&showroomId=&date=` | Public: list configured slots and persisted availability |
| GET | `/api/v1/admin/test-drives` | Admin list of all appointments (`data.items`) |
| PUT | `/api/v1/admin/test-drives/{id}/status` | Admin approves (`CONFIRMED`) or rejects (`REJECTED`) a pending request |

Test-drive responses use the standard `{success,message,data}` envelope and uppercase statuses: `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `REJECTED`. New requests are tied to the authenticated customer and remain `PENDING` until an admin confirms or rejects them. Customers may cancel their own `PENDING` or `CONFIRMED` appointments; admin transitions are `PENDING -> CONFIRMED|REJECTED` and `CONFIRMED -> COMPLETED|CANCELLED`. Terminal statuses cannot change. Appointment dates must be today through 30 days ahead. An active slot is unique by car, showroom, date, and time; cancellation or rejection releases it. Supported showroom IDs are `hn-tay-ho`, `hcm-q7`, and `dn-hai-chau`. Since customer-service does not depend on vehicle-service, `carName` uses the submitted optional name or falls back to `carSlug`.

Profile phone is owned by Auth (`users.phone`), not `customers`; the current Auth API has no phone-update endpoint. The profile response includes phone and email read from `GET /api/v1/auth/me`. Address phone remains editable as part of the address book.

The JWT verifier follows Auth's current JJWT token: same HS key from `JWT_SECRET`, issuer from `JWT_ISSUER` (default `car-sales-auth`), signed token, `userId`, an allowed `CUSTOMER` or `ADMIN` role, and expiry. Route authorization limits CUSTOMER and ADMIN access as described above; profile endpoints remain CUSTOMER-only. Profile GET/creation additionally forwards the token to Auth `/me`, which checks the account's current status. Auth REST failures map to 401/502/503. Address/profile update operations rely on the signed token; as with any stateless access token, status changes are rechecked when Auth `/me` is called.

## Run

1. For a fresh database, apply `database/customer_db/schema.sql` (and optional seed) manually. For an existing installation using `ddl-auto: validate`, apply or rerun the idempotent `database/customer_db/001_test_drives.sql` migration to `customer_db` before deploying this service version; Hibernate will not create the new table or update the active-slot rule.
2. Set `CUSTOMER_DB_URL`, `CUSTOMER_DB_USERNAME`, `CUSTOMER_DB_PASSWORD`, and the same `JWT_SECRET` / `JWT_ISSUER` used by Auth. Set `AUTH_SERVICE_URL` if Auth is not at `http://localhost:8081`.
3. From this directory run `mvn spring-boot:run`. Default port: `8082`.

Run unit tests with `mvn test`. A Postman collection is at `postman/Customer-Service.postman_collection.json` (workspace root).

## Reviews

The inspected `customer_db` schema has no review table. Review API is not implemented and the database is unchanged. `proposals/reviews_schema.sql` is an unapplied proposal only; it uses a logical vehicle ID and an internal FK to customers.
