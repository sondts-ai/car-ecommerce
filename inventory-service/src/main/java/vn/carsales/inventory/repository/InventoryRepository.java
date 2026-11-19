package vn.carsales.inventory.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.inventory.domain.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    @Query("select i from Inventory i join fetch i.branch where i.vehicleId = :vehicleId")
    Optional<Inventory> findByVehicleId(@Param("vehicleId") Long vehicleId);

    @Query("select i from Inventory i join fetch i.branch where i.vehicleId in :ids")
    List<Inventory> findByVehicleIds(@Param("ids") Collection<Long> vehicleIds);

    boolean existsByBranchId(Long branchId);

    @Query("select b.id, b.name, count(i) from Inventory i join i.branch b group by b.id, b.name order by b.id")
    List<Object[]> countByBranch();
}
