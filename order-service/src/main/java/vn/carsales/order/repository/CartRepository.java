package vn.carsales.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.order.domain.*;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart,Long>{
    Optional<Cart> findByCustomerIdAndStatus(Long customerId,CartStatus status);
}
