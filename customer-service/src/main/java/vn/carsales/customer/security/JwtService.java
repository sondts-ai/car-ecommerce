package vn.carsales.customer.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {
    private final SecretKey key; private final String issuer;
    public JwtService(@Value("${app.jwt.secret}") String secret,@Value("${app.jwt.issuer}") String issuer){
        if(secret.getBytes(StandardCharsets.UTF_8).length<32) throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));this.issuer=issuer;
    }
    public CustomerPrincipal verify(String token){
        var c=Jwts.parser().verifyWith(key).requireIssuer(issuer).build().parseSignedClaims(token).getPayload();
        Object rawId=c.get("userId");
        if(!(rawId instanceof Number id)||id.longValue()<=0) throw new IllegalArgumentException("JWT userId claim is missing");
        String role=c.get("role",String.class);
        if(!"CUSTOMER".equals(role)&&!"ADMIN".equals(role)) throw new IllegalArgumentException("Unsupported JWT role");
        if(c.getSubject()==null||c.getSubject().isBlank()) throw new IllegalArgumentException("JWT subject is missing");
        return new CustomerPrincipal(id.longValue(),c.getSubject(),role);
    }
}
