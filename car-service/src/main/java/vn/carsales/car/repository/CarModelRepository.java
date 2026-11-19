package vn.carsales.car.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import vn.carsales.car.domain.CarModel;

public interface CarModelRepository extends JpaRepository<CarModel, Long>, JpaSpecificationExecutor<CarModel> {
    boolean existsByBrandId(Long brandId);
    boolean existsByBrandIdAndNameIgnoreCase(Long brandId, String name);
    boolean existsByBrandIdAndNameIgnoreCaseAndIdNot(Long brandId, String name, Long id);
}
