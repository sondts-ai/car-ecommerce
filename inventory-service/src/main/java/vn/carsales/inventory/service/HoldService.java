package vn.carsales.inventory.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.criteria.Predicate;
import vn.carsales.inventory.api.InventoryDtos.HoldResponse;
import vn.carsales.inventory.api.PageResponse;
import vn.carsales.inventory.domain.Enums.HoldStatus;
import vn.carsales.inventory.domain.Enums.VehicleStatus;
import vn.carsales.inventory.domain.Vehicle;
import vn.carsales.inventory.domain.VehicleHold;
import vn.carsales.inventory.domain.VehicleStatusHistory;
import vn.carsales.inventory.repository.VehicleHoldRepository;
import vn.carsales.inventory.repository.VehicleRepository;
import vn.carsales.inventory.repository.VehicleStatusHistoryRepository;

@Service
public class HoldService {

    public static final String EXPIRED_REASON = "Hết hạn giữ xe";
    private static final Logger log = LoggerFactory.getLogger(HoldService.class);

    private final VehicleHoldRepository holds;
    private final VehicleRepository vehicles;
    private final VehicleStatusHistoryRepository history;
    private final TransactionTemplate tx;

    public HoldService(VehicleHoldRepository holds, VehicleRepository vehicles,
                       VehicleStatusHistoryRepository history, PlatformTransactionManager txManager) {
        this.holds = holds;
        this.vehicles = vehicles;
        this.history = history;
        this.tx = new TransactionTemplate(txManager);
    }

    public PageResponse<HoldResponse> list(HoldStatus status, Long vehicleId, int page, int size) {
        Specification<VehicleHold> spec = (root, q, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (vehicleId != null) ps.add(cb.equal(root.get("vehicleId"), vehicleId));
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<VehicleHold> p = holds.findAll(spec, PageResponse.pageable(page, size));
        return PageResponse.of(p, HoldResponse::of);
    }

    /** Hold -> RELEASED, xe RESERVED -> AVAILABLE, ghi history: tất cả trong 1 transaction. */
    public HoldResponse release(Long holdId, String reason, Long userId) {
        return tx.execute(s -> {
            VehicleHold hold = holds.findByIdForUpdate(holdId).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lượt giữ xe"));
            if (hold.getStatus() != HoldStatus.ACTIVE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Chỉ giải phóng được lượt giữ đang ACTIVE");
            }
            String r = reason == null || reason.isBlank() ? "Admin giải phóng lượt giữ xe" : reason.trim();
            return HoldResponse.of(doRelease(hold, r, userId));
        });
    }

    /** Giải phóng mọi hold ACTIVE đã quá hạn; mỗi hold một transaction riêng. @return số hold đã giải phóng. */
    public int expireOverdue(LocalDateTime now) {
        List<Long> ids = holds.findIdsByStatusAndExpiresBefore(HoldStatus.ACTIVE, now);
        int count = 0;
        for (Long id : ids) {
            try {
                Boolean done = tx.execute(s -> {
                    VehicleHold hold = holds.findByIdForUpdate(id).orElse(null);
                    if (hold == null || hold.getStatus() != HoldStatus.ACTIVE || !hold.getExpiresAt().isBefore(now)) {
                        return false;
                    }
                    doRelease(hold, EXPIRED_REASON, null);
                    return true;
                });
                if (Boolean.TRUE.equals(done)) {
                    count++;
                }
            } catch (RuntimeException e) {
                log.error("Không giải phóng được lượt giữ {}", id, e);
            }
        }
        return count;
    }

    private VehicleHold doRelease(VehicleHold hold, String reason, Long userId) {
        hold.setStatus(HoldStatus.RELEASED);
        hold.setReleasedReason(reason);
        holds.saveAndFlush(hold);
        Vehicle v = vehicles.findByIdForUpdate(hold.getVehicleId()).orElse(null);
        if (v != null && v.getStatus() == VehicleStatus.RESERVED) {
            v.setStatus(VehicleStatus.AVAILABLE);
            vehicles.saveAndFlush(v);
            history.save(VehicleStatusHistory.of(v.getId(), VehicleStatus.RESERVED, VehicleStatus.AVAILABLE,
                    reason, userId));
        }
        return hold;
    }
}
