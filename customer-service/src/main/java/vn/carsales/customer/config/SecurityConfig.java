package vn.carsales.customer.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import vn.carsales.customer.api.ApiResponse;
import vn.carsales.customer.security.JwtAuthenticationFilter;
import vn.carsales.customer.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain security(HttpSecurity http,JwtService jwt,ObjectMapper mapper)throws Exception{
        return http.csrf(c->c.disable()).cors(c->{}).sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
          .exceptionHandling(e->e.authenticationEntryPoint((req,res,ex)->{
              res.setStatus(HttpStatus.UNAUTHORIZED.value());res.setCharacterEncoding(StandardCharsets.UTF_8.name());res.setContentType(MediaType.APPLICATION_JSON_VALUE);
              mapper.writeValue(res.getOutputStream(),new ApiResponse<>(false,"Authentication required or JWT is invalid",null));
          }).accessDeniedHandler((req,res,ex)->{
              res.setStatus(HttpStatus.FORBIDDEN.value());res.setCharacterEncoding(StandardCharsets.UTF_8.name());res.setContentType(MediaType.APPLICATION_JSON_VALUE);
              mapper.writeValue(res.getOutputStream(),new ApiResponse<>(false,"Required role is missing",null));
          }))
          .authorizeHttpRequests(a->a
              .requestMatchers("/actuator/health", "/actuator/health/**", "/actuator/info").permitAll()
              .requestMatchers("/api/v1/admin/test-drives", "/api/v1/admin/test-drives/**").hasRole("ADMIN")
              .requestMatchers(HttpMethod.POST, "/api/v1/test-drives").hasRole("CUSTOMER")
              .requestMatchers(HttpMethod.GET, "/api/v1/test-drives/slots").permitAll()
              .requestMatchers(HttpMethod.GET, "/api/v1/test-drives").hasRole("CUSTOMER")
              .requestMatchers(HttpMethod.DELETE, "/api/v1/test-drives/**").hasRole("CUSTOMER")
              .anyRequest().hasRole("CUSTOMER"))
          .addFilterBefore(new JwtAuthenticationFilter(jwt),UsernamePasswordAuthenticationFilter.class).build();
    }
    @Bean CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins}")String origins){
        CorsConfiguration c=new CorsConfiguration();c.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
        c.setAllowedMethods(java.util.List.of("GET","POST","PUT","DELETE","OPTIONS"));c.setAllowedHeaders(java.util.List.of("Authorization","Content-Type"));
        UrlBasedCorsConfigurationSource source=new UrlBasedCorsConfigurationSource();source.registerCorsConfiguration("/**",c);return source;
    }
}
