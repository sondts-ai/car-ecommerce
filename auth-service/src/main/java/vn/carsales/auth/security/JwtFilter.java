package vn.carsales.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;
import vn.carsales.auth.repository.UserAccountRepository;
import vn.carsales.auth.domain.AccountStatus;

public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwt;
    private final UserAccountRepository users;
    public JwtFilter(JwtService jwt, UserAccountRepository users) { this.jwt = jwt; this.users = users; }
    @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String header = req.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                var claims = jwt.parse(header.substring(7).trim());
                String subject = claims.getSubject(); String role = claims.get("role", String.class);
                var account = subject == null ? null : users.findByEmailIgnoreCase(subject).orElse(null);
                boolean roleExists = account != null && account.getRoles().stream().anyMatch(r -> r.getName().equals(role));
                if (subject != null && role != null && account != null && account.getStatus() == AccountStatus.ACTIVE && roleExists) {
                    var auth = new UsernamePasswordAuthenticationToken(subject, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (RuntimeException ignored) { SecurityContextHolder.clearContext(); }
        }
        chain.doFilter(req, res);
    }
}
