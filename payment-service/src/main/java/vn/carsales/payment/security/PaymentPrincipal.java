package vn.carsales.payment.security;

public record PaymentPrincipal(Long userId, String email, String role) {}
