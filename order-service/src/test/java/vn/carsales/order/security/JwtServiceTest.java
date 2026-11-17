package vn.carsales.order.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest{
    private static final String SECRET="local-test-secret-which-is-at-least-32-bytes";
    private static final String ISSUER="car-sales-auth";
    private final SecretKey key=Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    private final JwtService jwt=new JwtService(SECRET,ISSUER);
    @Test void readsAuthServiceCustomerToken(){
        String token=Jwts.builder().issuer(ISSUER).subject("customer@example.com").claim("userId",42L).claim("role","CUSTOMER")
                .issuedAt(Date.from(Instant.now())).expiration(Date.from(Instant.now().plusSeconds(60))).signWith(key).compact();
        var principal=jwt.verify(token);assertEquals(42L,principal.userId());assertEquals("CUSTOMER",principal.role());
    }
    @Test void rejectsOtherRoles(){
        String token=Jwts.builder().issuer(ISSUER).subject("staff@example.com").claim("userId",7L).claim("role","STAFF")
                .issuedAt(Date.from(Instant.now())).expiration(Date.from(Instant.now().plusSeconds(60))).signWith(key).compact();
        assertThrows(IllegalArgumentException.class,()->jwt.verify(token));
    }
}
