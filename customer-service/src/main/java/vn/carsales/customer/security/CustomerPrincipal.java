package vn.carsales.customer.security;
public record CustomerPrincipal(Long userId,String email,String role){}
