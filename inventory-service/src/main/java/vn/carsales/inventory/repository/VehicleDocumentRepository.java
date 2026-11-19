package vn.carsales.inventory.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.carsales.inventory.domain.VehicleDocument;

public interface VehicleDocumentRepository extends JpaRepository<VehicleDocument, Long> {
    List<VehicleDocument> findByVehicleIdOrderByIdAsc(Long vehicleId);
}
