package vn.carsales.payment.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final String issuer;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.issuer}") String issuer) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32)
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
    }

    public PaymentPrincipal verify(String token) {
        var claims = Jwts.parser().verifyWith(key).requireIssuer(issuer).build()
                .parseSignedClaims(token).getPayload();
        Object raw = claims.get("userId");
        if (!(raw instanceof Number id) || id.longValue() <= 0)
            throw new IllegalArgumentException("JWT userId claim is missing");
        String role = claims.get("role", String.class);
        if (!"CUSTOMER".equals(role))
            throw new IllegalArgumentException("CUSTOMER role is required");
        String email = claims.getSubject();
        if (email == null || email.isBlank())
            throw new IllegalArgumentException("JWT subject is missing");
        return new PaymentPrincipal(id.longValue(), email, role);
    }
}
