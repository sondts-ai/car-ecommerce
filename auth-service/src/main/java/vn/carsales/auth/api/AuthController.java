package vn.carsales.auth.api;

import jakarta.validation.Valid;
import vn.carsales.auth.api.AuthDtos.*;
import vn.carsales.auth.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service=service; }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegistrationView> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok("Registration successful", service.register(request));
    }
    @PostMapping("/login")
    public ApiResponse<AuthView> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok("Login successful", service.login(request));
    }
    @GetMapping("/me")
    public ApiResponse<UserView> me(Authentication authentication) {
        return ApiResponse.ok("Current account", service.me(authentication.getName()));
    }
    @PutMapping("/change-password")
    public ApiResponse<Void> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(authentication.getName(),request);
        return ApiResponse.ok("Password changed",null);
    }
}
