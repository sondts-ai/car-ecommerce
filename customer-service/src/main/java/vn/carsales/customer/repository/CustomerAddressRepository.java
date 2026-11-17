package vn.carsales.customer.repository;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import vn.carsales.customer.domain.CustomerAddress;
import java.util.List;
import java.util.Optional;

public interface CustomerAddressRepository extends JpaRepository<CustomerAddress,Long> {
    List<CustomerAddress> findAllByCustomerIdOrderByIdDesc(Long customerId);
    Optional<CustomerAddress> findByIdAndCustomerId(Long id,Long customerId);
    Optional<CustomerAddress> findFirstByCustomerIdAndIsDefaultTrue(Long customerId);
    @Modifying(flushAutomatically=true,clearAutomatically=true)
    @Transactional
    @Query("update CustomerAddress a set a.isDefault=false where a.customer.id=:customerId and a.isDefault=true")
    int clearDefault(@Param("customerId") Long customerId);
}
