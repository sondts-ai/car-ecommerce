package vn.carsales.inventory.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import vn.carsales.inventory.domain.Enums.HoldStatus;
import vn.carsales.inventory.domain.VehicleHold;

public interface VehicleHoldRepository extends JpaRepository<VehicleHold, Long>, JpaSpecificationExecutor<VehicleHold> {
    boolean existsByVehicleId(Long vehicleId);
    boolean existsByVehicleIdAndStatus(Long vehicleId, HoldStatus status);
    Optional<VehicleHold> findFirstByVehicleIdAndStatus(Long vehicleId, HoldStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select h from VehicleHold h where h.id = :id")
    Optional<VehicleHold> findByIdForUpdate(@Param("id") Long id);

    @Query("select h.id from VehicleHold h where h.status = :status and h.expiresAt < :now order by h.id")
    List<Long> findIdsByStatusAndExpiresBefore(@Param("status") HoldStatus status, @Param("now") LocalDateTime now);
}
