package vn.carsales.payment.api;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import vn.carsales.payment.domain.Gateway;
import vn.carsales.payment.domain.PaymentStatus;
import vn.carsales.payment.domain.RefundStatus;

public final class PaymentDtos {
    private PaymentDtos() {}

    public record DepositIntentRequest(
            @NotNull @Positive Long orderId,
            @NotNull @Positive BigDecimal amount,
            @NotNull Gateway gateway) {}

    public record ConfirmRequest(@Size(max = 20) String responseCode) {}

    public record RefundRequest(
            @NotNull @Positive BigDecimal amount,
            @Size(max = 500) String reason) {}

    public record PaymentView(
            Long id,
            String depositId,
            BigDecimal amount,
            Gateway method,
            PaymentStatus status,
            Long transactionId,
            String transactionCode,
            LocalDateTime createdAt) {}

    public record RefundView(
            Long id,
            Long paymentId,
            BigDecimal amount,
            String reason,
            RefundStatus status,
            LocalDateTime createdAt) {}
}
