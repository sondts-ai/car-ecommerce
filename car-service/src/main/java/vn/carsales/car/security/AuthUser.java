package vn.carsales.car.security;

/** Thông tin người dùng đọc từ JWT (claim userId, role). */
public record AuthUser(Long userId, String role) {
}
