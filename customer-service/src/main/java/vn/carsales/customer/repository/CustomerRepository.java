package vn.carsales.customer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.customer.domain.Customer;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer,Long> {
    Optional<Customer> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
