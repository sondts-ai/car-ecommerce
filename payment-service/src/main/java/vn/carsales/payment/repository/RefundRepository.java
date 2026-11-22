package vn.carsales.payment.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.payment.domain.Refund;

public interface RefundRepository extends JpaRepository<Refund, Long> {
}
