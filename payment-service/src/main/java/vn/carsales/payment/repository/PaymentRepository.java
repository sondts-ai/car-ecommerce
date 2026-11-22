package vn.carsales.payment.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.payment.domain.Payment;
import vn.carsales.payment.domain.PaymentType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findFirstByOrderIdAndPaymentTypeOrderByCreatedAtDesc(Long orderId, PaymentType paymentType);
}
