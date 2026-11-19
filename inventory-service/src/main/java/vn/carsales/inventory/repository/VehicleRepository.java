package vn.carsales.inventory.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import vn.carsales.inventory.domain.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Long>, JpaSpecificationExecutor<Vehicle> {
    boolean existsByVinIgnoreCase(String vin);
    boolean existsByVinIgnoreCaseAndIdNot(String vin, Long id);
    boolean existsByLicensePlateIgnoreCase(String plate);
    boolean existsByLicensePlateIgnoreCaseAndIdNot(String plate, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from Vehicle v where v.id = :id")
    Optional<Vehicle> findByIdForUpdate(@Param("id") Long id);

    @Query("select v.status, count(v) from Vehicle v group by v.status")
    List<Object[]> countByStatus();

    @Query("select v.condition, count(v) from Vehicle v group by v.condition")
    List<Object[]> countByCondition();
}
