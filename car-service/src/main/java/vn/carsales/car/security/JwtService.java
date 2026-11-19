package vn.carsales.car.security;

import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Chỉ VERIFY token do Auth Service phát hành (HS256), không tự phát hành. */
@Component
public class JwtService {

    private final SecretKey key;
    private final String issuer;

    public JwtService(@Value("${app.jwt.secret}") String secret, @Value("${app.jwt.issuer}") String issuer) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET phải dài ít nhất 32 byte");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.issuer = issuer;
    }

    /** @throws JwtException hoặc IllegalArgumentException nếu token sai/hết hạn/thiếu claim */
    public AuthUser parse(String token) {
        Claims claims = Jwts.parser().verifyWith(key).requireIssuer(issuer).build()
                .parseSignedClaims(token).getPayload();
        Number userId = claims.get("userId", Number.class);
        String role = claims.get("role", String.class);
        if (userId == null || role == null || role.isBlank()) {
            throw new IllegalArgumentException("Token thiếu claim userId hoặc role");
        }
        return new AuthUser(userId.longValue(), role);
    }
}
