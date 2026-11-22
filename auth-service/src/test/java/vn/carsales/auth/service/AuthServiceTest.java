package vn.carsales.auth.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.carsales.auth.api.AuthDtos.*;
import vn.carsales.auth.domain.*;
import vn.carsales.auth.repository.*;
import vn.carsales.auth.security.JwtService;
import vn.carsales.auth.client.CustomerProfileClient;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock UserAccountRepository users;
    @Mock RoleRepository roles;
    @Mock PasswordEncoder encoder;
    @Mock JwtService jwt;
    @Mock CustomerProfileClient profiles;
    @InjectMocks AuthService service;

    @Test void registerStoresBCryptHashAndServerAssignedCustomerRole() {
        Role customer=mock(Role.class);
        when(roles.findByName("CUSTOMER")).thenReturn(Optional.of(customer));
        when(encoder.encode("password123")).thenReturn("$2b$hash");
        when(users.existsByEmailIgnoreCase("buyer@example.com")).thenReturn(false);
        when(users.existsByPhone("0912345678")).thenReturn(false);

        RegistrationView result=service.register(new RegisterRequest("Buyer Name","buyer@example.com","0912345678","password123","password123"));

        assertEquals("buyer@example.com",result.email());
        assertEquals("Buyer Name",result.fullName());
        assertEquals("CUSTOMER",result.role());
        verify(users).saveAndFlush(argThat(u -> "$2b$hash".equals(u.getPasswordHash()) && u.getRoles().contains(customer)));
        verify(profiles).createProfileQuietly(any(), eq("Buyer Name"));
    }

    @Test void loginIssuesJwtForActiveAccount() {
        Role customer=mock(Role.class); when(customer.getName()).thenReturn("CUSTOMER");
        UserAccount account=new UserAccount(); account.setEmail("buyer@example.com"); account.setPasswordHash("bcrypt"); account.setPhone("0912345678"); account.addRole(customer);
        when(users.findByEmailIgnoreCase("buyer@example.com")).thenReturn(Optional.of(account));
        when(encoder.matches("password123","bcrypt")).thenReturn(true);
        when(jwt.issue(account)).thenReturn("signed.jwt");

        AuthView result=service.login(new LoginRequest("buyer@example.com","password123"));

        assertEquals("signed.jwt",result.token()); assertEquals("Bearer",result.tokenType());
    }

    @Test void loginRejectsWrongPassword() {
        UserAccount account=new UserAccount(); account.setEmail("buyer@example.com"); account.setPasswordHash("bcrypt");
        when(users.findByEmailIgnoreCase("buyer@example.com")).thenReturn(Optional.of(account));
        when(encoder.matches("wrong","bcrypt")).thenReturn(false);
        assertThrows(BadCredentialsException.class, () -> service.login(new LoginRequest("buyer@example.com","wrong")));
        verify(jwt,never()).issue(any());
    }
}
