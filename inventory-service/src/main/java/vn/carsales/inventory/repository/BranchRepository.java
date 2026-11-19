package vn.carsales.inventory.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.carsales.inventory.domain.Branch;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    @Query("select b from Branch b where lower(b.name) like lower(concat('%', :q, '%'))")
    Page<Branch> search(@Param("q") String q, Pageable pageable);
}
