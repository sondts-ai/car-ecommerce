package vn.carsales.inventory.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.inventory.domain.VehicleImage;

public interface VehicleImageRepository extends JpaRepository<VehicleImage, Long> {
    List<VehicleImage> findByVehicleIdOrderBySortOrderAscIdAsc(Long vehicleId);

    @Query("select i from VehicleImage i where i.vehicleId in :ids and i.thumbnail = true")
    List<VehicleImage> findThumbnails(@Param("ids") Collection<Long> vehicleIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update VehicleImage i set i.thumbnail = false where i.vehicleId = :vehicleId and i.thumbnail = true")
    int clearThumbnail(@Param("vehicleId") Long vehicleId);
}
