package vn.carsales.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.order.domain.CustomerOrder;
import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder,Long>{
    List<CustomerOrder> findAllByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<CustomerOrder> findByIdAndCustomerId(Long id,Long customerId);
}
