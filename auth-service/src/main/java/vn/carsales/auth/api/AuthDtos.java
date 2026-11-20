package vn.carsales.auth.api;

import jakarta.validation.constraints.*;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(@NotBlank @Size(min=2,max=150) String fullName,
          @NotBlank @Email @Size(max=190) String email,
          @NotBlank @Pattern(regexp="^\\+?[0-9]{9,20}$") String phone,
          @NotBlank @Size(min=8,max=72) String password,
          @NotBlank String confirmPassword) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record ChangePasswordRequest(@NotBlank String currentPassword,
          @NotBlank @Size(min=8,max=72) String newPassword,
          @NotBlank String confirmPassword) {}
    public record UserView(Long id, String email, String phone, String role, String status) {}
    public record RegistrationView(Long userId, String fullName, String email, String phone, String role, String status) {}
    public record AuthView(String token, String tokenType, UserView user) {}
}
