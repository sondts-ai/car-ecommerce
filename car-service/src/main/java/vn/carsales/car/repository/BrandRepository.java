package vn.carsales.car.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.car.domain.Brand;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select b from Brand b where lower(b.name) like lower(concat('%', :q, '%'))")
    Page<Brand> search(@Param("q") String q, Pageable pageable);
}
