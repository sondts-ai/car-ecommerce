package vn.carsales.order.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

public class JwtAuthenticationFilter extends OncePerRequestFilter{
    private final JwtService jwt;
    public JwtAuthenticationFilter(JwtService jwt){this.jwt=jwt;}
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
        String header=request.getHeader("Authorization");
        if(header!=null&&header.startsWith("Bearer "))try{
            OrderPrincipal principal=jwt.verify(header.substring(7).trim());
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER"))));
        }catch(RuntimeException invalid){SecurityContextHolder.clearContext();}
        chain.doFilter(request,response);
    }
}
