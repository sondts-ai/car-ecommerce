package vn.carsales.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.carsales.inventory.domain.VehicleStatusHistory;

public interface VehicleStatusHistoryRepository extends JpaRepository<VehicleStatusHistory, Long> {
    List<VehicleStatusHistory> findByVehicleIdOrderByCreatedAtDescIdDesc(Long vehicleId);
}
