package vn.carsales.auth.service;

import vn.carsales.auth.api.AuthDtos.*;
import vn.carsales.auth.domain.*;
import vn.carsales.auth.repository.*;
import vn.carsales.auth.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import vn.carsales.auth.client.CustomerProfileClient;

@Service
public class AuthService {
    private final UserAccountRepository users; private final RoleRepository roles; private final PasswordEncoder encoder; private final JwtService jwt;
    private final CustomerProfileClient profiles;
    public AuthService(UserAccountRepository users, RoleRepository roles, PasswordEncoder encoder, JwtService jwt, CustomerProfileClient profiles) {
        this.users=users; this.roles=roles; this.encoder=encoder; this.jwt=jwt; this.profiles=profiles;
    }
    @Transactional
    public RegistrationView register(RegisterRequest r) {
        if (!r.password().equals(r.confirmPassword())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password confirmation does not match");
        String email=r.email().trim().toLowerCase(); String phone=r.phone().trim();
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Email is already registered");
        if (users.existsByPhone(phone)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Phone is already registered");
        Role customer=roles.findByName("CUSTOMER").orElseThrow(() -> new IllegalStateException("CUSTOMER role is missing; apply auth_db seed.sql first"));
        UserAccount u=new UserAccount(); u.setEmail(email); u.setPhone(phone); u.setPasswordHash(encoder.encode(r.password())); u.addRole(customer);
        users.saveAndFlush(u);
        createCustomerProfileAfterCommit(u, r.fullName().trim());
        // fullName is returned for the future Customer Service profile-creation call; it is not an auth_db column.
        return new RegistrationView(u.getId(),r.fullName().trim(),u.getEmail(),u.getPhone(),"CUSTOMER",u.getStatus().name());
    }

    /**
     * Tạo profile bên Customer Service sau khi transaction auth_db commit,
     * để Customer Service gọi ngược /auth/me nhìn thấy user vừa tạo.
     */
    private void createCustomerProfileAfterCommit(UserAccount user, String fullName) {
        String token = jwt.issue(user);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() {
                    profiles.createProfileQuietly(token, fullName);
                }
            });
        } else {
            profiles.createProfileQuietly(token, fullName);
        }
    }
    @Transactional(readOnly=true)
    public AuthView login(LoginRequest r) {
        UserAccount u=users.findByEmailIgnoreCase(r.email().trim()).orElseThrow(() -> new BadCredentialsException("Email or password is incorrect"));
        if (!encoder.matches(r.password(),u.getPasswordHash())) throw new BadCredentialsException("Email or password is incorrect");
        if (u.getStatus()!=AccountStatus.ACTIVE) throw new DisabledException("Account is not active");
        return new AuthView(jwt.issue(u),"Bearer",view(u));
    }
    @Transactional(readOnly=true)
    public UserView me(String email) { return view(users.findByEmailIgnoreCase(email).orElseThrow(() -> new BadCredentialsException("Account not found"))); }
    @Transactional
    public void changePassword(String email, ChangePasswordRequest r) {
        if (!r.newPassword().equals(r.confirmPassword())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password confirmation does not match");
        UserAccount u=users.findByEmailIgnoreCase(email).orElseThrow(() -> new BadCredentialsException("Account not found"));
        if (!encoder.matches(r.currentPassword(),u.getPasswordHash())) throw new BadCredentialsException("Current password is incorrect");
        if (encoder.matches(r.newPassword(),u.getPasswordHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"New password must differ from current password");
        u.setPasswordHash(encoder.encode(r.newPassword()));
    }
    private UserView view(UserAccount u) { String role=u.getRoles().stream().map(Role::getName).sorted().findFirst().orElse("CUSTOMER"); return new UserView(u.getId(),u.getEmail(),u.getPhone(),role,u.getStatus().name()); }
}
