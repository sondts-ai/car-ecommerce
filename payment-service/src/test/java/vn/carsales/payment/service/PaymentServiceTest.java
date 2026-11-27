package vn.carsales.payment.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.carsales.payment.api.PaymentDtos.DepositIntentRequest;
import vn.carsales.payment.domain.Gateway;
import vn.carsales.payment.domain.Payment;
import vn.carsales.payment.domain.PaymentStatus;
import vn.carsales.payment.domain.PaymentTransaction;
import vn.carsales.payment.domain.PaymentType;
import vn.carsales.payment.domain.TransactionStatus;
import vn.carsales.payment.repository.PaymentRepository;
import vn.carsales.payment.repository.PaymentTransactionRepository;
import vn.carsales.payment.repository.RefundRepository;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    @Mock PaymentRepository payments;
    @Mock PaymentTransactionRepository transactions;
    @Mock RefundRepository refunds;
    @Mock OrderStatusClient orderStatusClient;
    @Mock CustomerIdentityClient customerIdentity;
    @Mock OrderOwnershipClient orderOwnership;
    @InjectMocks PaymentService service;

    @Test
    void confirmsPendingDepositImmediately() {
        Payment payment = new Payment();
        payment.setOrderId(30L);
        payment.setAmount(new BigDecimal("50.00"));
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setTransactionCode("DEP-TEST");
        transaction.setGateway(Gateway.VNPAY);
        transaction.setAmount(new BigDecimal("50.00"));

        when(payments.findById(4L)).thenReturn(Optional.of(payment));
        when(customerIdentity.customerId(7L, "Bearer token")).thenReturn(70L);
        when(orderOwnership.verify(30L, 70L)).thenReturn(
                new OrderOwnershipClient.OrderOwnership(30L, 70L, new BigDecimal("50.00"), new BigDecimal("500.00")));
        when(transactions.findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
                4L, TransactionStatus.PENDING)).thenReturn(Optional.of(transaction));
        when(transactions.save(transaction)).thenReturn(transaction);

        var result = service.confirmDeposit(7L, "Bearer token", 4L, null);

        assertEquals(PaymentStatus.PAID, result.status());
        assertEquals(TransactionStatus.SUCCESS, transaction.getTransactionStatus());
        verify(orderStatusClient).markDepositPaid(30L, "DEP-TEST");
    }

    @Test
    void reusesAnExistingPendingIntentWhenCustomerRetries() {
        Payment payment = new Payment();
        payment.setOrderId(30L);
        payment.setAmount(new BigDecimal("50.00"));
        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setTransactionCode("DEP-RETRY");
        transaction.setGateway(Gateway.VNPAY);

        when(customerIdentity.customerId(7L, "Bearer token")).thenReturn(70L);
        when(orderOwnership.verify(30L, 70L)).thenReturn(
                new OrderOwnershipClient.OrderOwnership(30L, 70L, new BigDecimal("50.00"), new BigDecimal("500.00")));
        when(payments.findFirstByOrderIdAndPaymentTypeOrderByCreatedAtDesc(30L, PaymentType.DEPOSIT))
                .thenReturn(Optional.of(payment));
        when(transactions.findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
                isNull(), eq(TransactionStatus.PENDING))).thenReturn(Optional.of(transaction));

        var result = service.createDepositIntent(7L, "Bearer token",
                new DepositIntentRequest(30L, new BigDecimal("50.00"), Gateway.VNPAY));

        assertEquals(PaymentStatus.PENDING, result.status());
        assertEquals("DEP-RETRY", result.transactionCode());
        verify(payments, never()).save(any(Payment.class));
    }
}
