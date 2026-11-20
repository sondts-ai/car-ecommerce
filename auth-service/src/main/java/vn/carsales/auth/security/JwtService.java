package vn.carsales.auth.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import vn.carsales.auth.domain.UserAccount;

@Service
public class JwtService {
    private final SecretKey key;
    private final String issuer;
    private final long ttl;
    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.expiration-ms}") long ttl) {
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)); this.issuer = issuer; this.ttl = ttl;
    }
    public String issue(UserAccount user) {
        Instant now = Instant.now();
        String role = user.getRoles().stream().map(r -> r.getName()).filter("CUSTOMER"::equals).findFirst().orElse("CUSTOMER");
        return Jwts.builder().issuer(issuer).subject(user.getEmail()).claim("userId", user.getId()).claim("role", role)
                .issuedAt(Date.from(now)).expiration(Date.from(now.plusMillis(ttl))).signWith(key).compact();
    }
    public io.jsonwebtoken.Claims parse(String token) {
        return Jwts.parser().verifyWith(key).requireIssuer(issuer).build().parseSignedClaims(token).getPayload();
    }
}
