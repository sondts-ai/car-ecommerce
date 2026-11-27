-- Idempotent migration for deployments whose customer_db predates test-drive support.
USE customer_db;

CREATE TABLE IF NOT EXISTS test_drives (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             BIGINT UNSIGNED DEFAULT NULL COMMENT 'Logic ref -> auth_db.users.id; NULL for guest bookings',
    code                VARCHAR(40)     NOT NULL,
    car_slug            VARCHAR(100)    NOT NULL,
    car_name            VARCHAR(150)    NOT NULL,
    showroom_id         VARCHAR(20)     NOT NULL,
    drive_date          DATE            NOT NULL,
    drive_time          TIME            NOT NULL,
    note                VARCHAR(1000)   DEFAULT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    customer_full_name  VARCHAR(150)    NOT NULL,
    customer_phone      VARCHAR(20)     NOT NULL,
    customer_email      VARCHAR(254)    DEFAULT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_slot_key     VARCHAR(150) GENERATED ALWAYS AS
                            (CASE WHEN status NOT IN ('CANCELLED', 'REJECTED')
                                  THEN CONCAT(car_slug, '|', showroom_id, '|', drive_date, '|', drive_time)
                                  ELSE NULL END) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uk_test_drives_code (code),
    UNIQUE KEY uk_test_drives_active_slot (active_slot_key),
    KEY idx_test_drives_user_created (user_id, created_at),
    KEY idx_test_drives_showroom_date (showroom_id, drive_date)
) ENGINE=InnoDB COMMENT='Persistent customer test-drive appointments';

-- Also upgrades an installation created by an earlier version of this migration.
ALTER TABLE test_drives MODIFY COLUMN user_id
    BIGINT UNSIGNED DEFAULT NULL COMMENT 'Logic ref -> auth_db.users.id; NULL for guest bookings';
ALTER TABLE test_drives MODIFY COLUMN active_slot_key
    VARCHAR(150) GENERATED ALWAYS AS
        (CASE WHEN status NOT IN ('CANCELLED', 'REJECTED')
              THEN CONCAT(car_slug, '|', showroom_id, '|', drive_date, '|', drive_time)
              ELSE NULL END) STORED;
