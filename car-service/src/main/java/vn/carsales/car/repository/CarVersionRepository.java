package vn.carsales.car.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.car.domain.CarVersion;

public interface CarVersionRepository extends JpaRepository<CarVersion, Long> {
    List<CarVersion> findByModelIdOrderByIdAsc(Long modelId);
    boolean existsByModelId(Long modelId);
    boolean existsByModelIdAndVersionNameIgnoreCase(Long modelId, String versionName);
    boolean existsByModelIdAndVersionNameIgnoreCaseAndIdNot(Long modelId, String versionName, Long id);

    @Query("select v from CarVersion v join fetch v.model m join fetch m.brand where v.id = :id")
    Optional<CarVersion> findDetailById(@Param("id") Long id);
}
