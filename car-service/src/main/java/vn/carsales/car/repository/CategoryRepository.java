package vn.carsales.car.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.car.domain.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    @org.springframework.data.jpa.repository.Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "delete from car_model_categories where category_id = :id", nativeQuery = true)
    void detachFromModels(@Param("id") Long id);

    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select c from Category c where lower(c.name) like lower(concat('%', :q, '%'))")
    Page<Category> search(@Param("q") String q, Pageable pageable);
}
