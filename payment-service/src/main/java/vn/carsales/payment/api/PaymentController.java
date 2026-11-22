package vn.carsales.payment.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import vn.carsales.payment.security.PaymentPrincipal;
import vn.carsales.payment.api.PaymentDtos.*;
import vn.carsales.payment.service.PaymentService;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/intent")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentView> createDepositIntent(
            Authentication auth,
            @RequestHeader("Authorization") String token,
            @Valid @RequestBody DepositIntentRequest request) {
        return ApiResponse.ok("Deposit payment intent created",
                payments.createDepositIntent(principal(auth).userId(), token, request));
    }

    @PostMapping("/{paymentId}/confirm")
    public ApiResponse<PaymentView> confirmDeposit(
            Authentication auth,
            @RequestHeader("Authorization") String token,
            @PathVariable Long paymentId,
            @Valid @RequestBody(required = false) ConfirmRequest request) {
        return ApiResponse.ok("Deposit payment confirmed",
                payments.confirmDeposit(principal(auth).userId(), token, paymentId, request));
    }

    @PostMapping("/{paymentId}/refunds")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RefundView> requestDepositRefund(
            Authentication auth,
            @RequestHeader("Authorization") String token,
            @PathVariable Long paymentId,
            @Valid @RequestBody RefundRequest request) {
        return ApiResponse.ok("Deposit refund requested",
                payments.requestDepositRefund(principal(auth).userId(), token, paymentId, request));
    }
    private PaymentPrincipal principal(Authentication auth) {
        return (PaymentPrincipal) auth.getPrincipal();
    }
}
