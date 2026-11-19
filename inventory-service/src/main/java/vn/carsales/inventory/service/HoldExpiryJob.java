package vn.carsales.inventory.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Mỗi 60 giây giải phóng các lượt giữ xe quá hạn. Tắt bằng HOLD_EXPIRY_JOB_ENABLED=false. */
@Component
@ConditionalOnProperty(name = "app.hold-expiry-job.enabled", havingValue = "true", matchIfMissing = true)
public class HoldExpiryJob {

    private static final Logger log = LoggerFactory.getLogger(HoldExpiryJob.class);

    private final HoldService holds;

    public HoldExpiryJob(HoldService holds) {
        this.holds = holds;
    }

    @Scheduled(fixedDelay = 60_000)
    public void run() {
        int released = holds.expireOverdue(LocalDateTime.now());
        if (released > 0) {
            log.info("Đã giải phóng {} lượt giữ xe quá hạn", released);
        }
    }
}
