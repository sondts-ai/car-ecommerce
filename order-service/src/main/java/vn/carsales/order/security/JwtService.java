package vn.carsales.order.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtService {
    private final SecretKey key;private final String issuer;
    public JwtService(@Value("${app.jwt.secret}")String secret,@Value("${app.jwt.issuer}")String issuer){
        if(secret.getBytes(StandardCharsets.UTF_8).length<32)throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
        key=Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));this.issuer=issuer;
    }
    public OrderPrincipal verify(String token){
        var claims=Jwts.parser().verifyWith(key).requireIssuer(issuer).build().parseSignedClaims(token).getPayload();
        Object raw=claims.get("userId");
        if(!(raw instanceof Number id)||id.longValue()<=0)throw new IllegalArgumentException("JWT userId claim is missing");
        String role=claims.get("role",String.class);
        if(role==null||role.isBlank())throw new IllegalArgumentException("JWT role claim is missing");
        if(!"CUSTOMER".equals(role)&&!"ADMIN".equals(role))
            throw new IllegalArgumentException("Unsupported role: "+role);
        String email=claims.getSubject();if(email==null||email.isBlank())throw new IllegalArgumentException("JWT subject is missing");
        return new OrderPrincipal(id.longValue(),email,role);
    }
}
