package vn.carsales.customer.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET="local-test-secret-which-is-at-least-32-bytes";
    private static final String ISSUER="car-sales-auth";
    private final SecretKey key=Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private final JwtService service=new JwtService(SECRET,ISSUER);

    @Test void acceptsAuthServiceTokenClaims(){
        String token=Jwts.builder().issuer(ISSUER).subject("customer@example.com").claim("userId",27L).claim("role","CUSTOMER")
                .issuedAt(Date.from(Instant.now())).expiration(Date.from(Instant.now().plusSeconds(300))).signWith(key).compact();
        CustomerPrincipal p=service.verify(token);
        assertEquals(27L,p.userId());assertEquals("customer@example.com",p.email());assertEquals("CUSTOMER",p.role());
    }
    @Test void rejectsTokenWithOtherRole(){
        String token=Jwts.builder().issuer(ISSUER).subject("admin@example.com").claim("userId",1L).claim("role","ADMIN")
                .issuedAt(Date.from(Instant.now())).expiration(Date.from(Instant.now().plusSeconds(300))).signWith(key).compact();
        assertThrows(IllegalArgumentException.class,()->service.verify(token));
    }
}
