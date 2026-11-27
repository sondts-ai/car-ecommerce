package vn.carsales.payment.service;

import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.payment.api.PaymentDtos.*;
import vn.carsales.payment.domain.*;
import vn.carsales.payment.repository.*;

@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final PaymentTransactionRepository transactions;
    private final RefundRepository refunds;
    private final OrderStatusClient orderStatusClient;
    private final CustomerIdentityClient customerIdentity;
    private final OrderOwnershipClient orderOwnership;

    public PaymentService(
            PaymentRepository payments,
            PaymentTransactionRepository transactions,
            RefundRepository refunds, OrderStatusClient orderStatusClient,
            CustomerIdentityClient customerIdentity,
            OrderOwnershipClient orderOwnership) {
        this.payments = payments;
        this.transactions = transactions;
        this.refunds = refunds;
        this.orderStatusClient = orderStatusClient;
        this.customerIdentity = customerIdentity;
        this.orderOwnership = orderOwnership;
    }

    @Transactional
    public PaymentView createDepositIntent(Long userId, String token, DepositIntentRequest request) {
        Long customerId = customerIdentity.customerId(userId, token);
        var order = orderOwnership.verify(request.orderId(), customerId);
        if (request.amount().compareTo(order.depositAmount()) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Payment amount must equal the order deposit amount");
        }
        var existingPayment = payments.findFirstByOrderIdAndPaymentTypeOrderByCreatedAtDesc(
                request.orderId(), PaymentType.DEPOSIT);
        if (existingPayment.isPresent()) {
            Payment payment = existingPayment.get();
            if (payment.getAmount().compareTo(request.amount()) != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Payment amount must equal the existing deposit payment amount");
            }
            if (payment.getStatus() != PaymentStatus.PENDING && payment.getStatus() != PaymentStatus.PAID) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "The existing deposit payment is no longer payable");
            }
            TransactionStatus transactionStatus = payment.getStatus() == PaymentStatus.PAID
                    ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
            PaymentTransaction transaction = transactions
                    .findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
                            payment.getId(), transactionStatus)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.CONFLICT, "The existing payment transaction is missing"));
            return view(payment, transaction);
        }
        Payment payment = new Payment();
        payment.setOrderId(request.orderId());
        payment.setAmount(request.amount());
        Payment saved = payments.save(payment);

        PaymentTransaction transaction = new PaymentTransaction();
        transaction.setPayment(saved);
        transaction.setTransactionCode("DEP-" + UUID.randomUUID().toString().replace("-", ""));
        transaction.setGateway(request.gateway());
        transaction.setAmount(request.amount());
        PaymentTransaction savedTransaction = transactions.save(transaction);
        return view(saved, savedTransaction);
    }

    @Transactional
    public PaymentView confirmDeposit(Long userId, String token, Long paymentId, ConfirmRequest request) {
        Payment payment = payment(paymentId);
        verifyOwnedOrder(userId, token, payment);
        if (payment.getStatus() == PaymentStatus.REFUNDED
                || payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Deposit payment is no longer payable");
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            PaymentTransaction transaction = transactions
                    .findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
                            paymentId, TransactionStatus.SUCCESS)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.CONFLICT, "Successful payment transaction not found"));
            return view(payment, transaction);
        }

        PaymentTransaction transaction = transactions
                .findFirstByPaymentIdAndTransactionStatusOrderByCreatedAtDesc(
                        paymentId, TransactionStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT, "Pending payment transaction not found"));
        transaction.setTransactionStatus(TransactionStatus.SUCCESS);
        transaction.setResponseCode(request == null ? null : request.responseCode());
        transaction.setPaidAt(LocalDateTime.now());
        payment.setStatus(PaymentStatus.PAID);
        orderStatusClient.markDepositPaid(payment.getOrderId(), transaction.getTransactionCode());
        return view(payment, transactions.save(transaction));
    }

    @Transactional
    public RefundView requestDepositRefund(Long userId, String token, Long paymentId, RefundRequest request) {
        Payment payment = payment(paymentId);
        verifyOwnedOrder(userId, token, payment);
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only a paid deposit can be refunded");
        }
        if (request.amount().compareTo(payment.getAmount()) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Refund amount cannot exceed deposit amount");
        }
        Refund refund = new Refund();
        refund.setPayment(payment);
        refund.setAmount(request.amount());
        refund.setReason(request.reason());
        return refundView(refunds.save(refund));
    }

    private Payment payment(Long paymentId) {
        return payments.findById(paymentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    private void verifyOwnedOrder(Long userId, String token, Payment payment) {
        Long customerId = customerIdentity.customerId(userId, token);
        orderOwnership.verify(payment.getOrderId(), customerId);
    }

    private PaymentView view(Payment payment, PaymentTransaction transaction) {
        return new PaymentView(
                payment.getId(),
                String.valueOf(payment.getOrderId()),
                payment.getAmount(),
                transaction.getGateway(),
                payment.getStatus(),
                transaction.getId(),
                transaction.getTransactionCode(),
                payment.getCreatedAt());
    }

    private RefundView refundView(Refund refund) {
        return new RefundView(
                refund.getId(),
                refund.getPayment().getId(),
                refund.getAmount(),
                refund.getReason(),
                refund.getStatus(),
                refund.getCreatedAt());
    }
}
