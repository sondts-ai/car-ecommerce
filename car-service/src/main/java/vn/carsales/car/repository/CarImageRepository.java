package vn.carsales.car.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.car.domain.CarImage;

public interface CarImageRepository extends JpaRepository<CarImage, Long> {
    List<CarImage> findByModelIdOrderBySortOrderAscIdAsc(Long modelId);

    @Query("select i from CarImage i where i.modelId in :ids and i.thumbnail = true")
    List<CarImage> findThumbnails(@Param("ids") Collection<Long> modelIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update CarImage i set i.thumbnail = false where i.modelId = :modelId and i.thumbnail = true")
    int clearThumbnail(@Param("modelId") Long modelId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from CarImage i where i.modelId = :modelId")
    int deleteByModelId(@Param("modelId") Long modelId);
}
