package vn.carsales.payment.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.payment.domain.PaymentTransaction;
import vn.carsales.payment.domain.TransactionStatus;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
            Long paymentId, TransactionStatus status);
}
