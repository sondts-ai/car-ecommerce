# Auth Service

Standalone Spring Boot Auth Service mapped to the supplied `auth_db` schema. It only owns account credentials, roles, account status, and JWT issuance. It does not access `customer_db`, `vehicle_db`, `order_db`, or `payment_db`.

## Current endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET | `/api/v1/auth/me` | Bearer JWT |
| PUT | `/api/v1/auth/change-password` | Bearer JWT |

Registration accepts `fullName` because the customer signup form needs it, but `auth_db.users` has no `full_name` column. The current response returns the account identity only; creating the corresponding customer profile must be completed through Customer Service REST integration when that service source/API is available.

## Run

Apply the `database/auth_db/schema.sql` and `seed.sql` entries from `car-ecommerce-main.zip` manually to MySQL first. The service uses Hibernate `ddl-auto: validate` and never changes the schema.

Set `AUTH_DB_URL`, `AUTH_DB_USERNAME`, `AUTH_DB_PASSWORD`, and `JWT_SECRET` (at least 32 UTF-8 bytes), then run from this directory:

```powershell
mvn spring-boot:run
```

Run unit tests with `mvn test`.

Defaults: port `8081`, database `auth_db` on localhost. Do not put real secrets in source control.

## Not implemented yet

- Password recovery: schema has no reset-token table. A safe single-use, expiring token flow needs an approved schema addition before implementation.
- Customer profile creation during registration: needs Customer Service endpoint and inter-service failure strategy.
- Authentication of JWTs by the other services: agree issuer/key or provide an Auth validation endpoint as part of integration.
