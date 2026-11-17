-- PROPOSAL ONLY: do not execute until the review schema is approved.
-- Adds customer-owned vehicle reviews to customer_db. vehicle_id is a logical
-- reference; no cross-database FK is created.
USE customer_db;

CREATE TABLE customer_vehicle_reviews (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id BIGINT UNSIGNED NOT NULL,
    vehicle_id  BIGINT UNSIGNED NOT NULL COMMENT 'Logical reference to vehicle service',
    rating      TINYINT UNSIGNED NOT NULL COMMENT 'Proposed range: 1 to 5',
    content     TEXT            NOT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reviews_customer (customer_id, created_at),
    KEY idx_reviews_vehicle (vehicle_id, created_at),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE,
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB COMMENT='Customer reviews for vehicles';
