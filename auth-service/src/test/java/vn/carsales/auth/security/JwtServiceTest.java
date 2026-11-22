package vn.carsales.auth.security;

import org.junit.jupiter.api.Test;
import vn.carsales.auth.domain.Role;
import vn.carsales.auth.domain.UserAccount;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceTest {

    private JwtService service() {
        return new JwtService("test-secret-test-secret-test-secret-123456", "car-sales-auth", 60_000);
    }

    private Role role(String name) {
        Role role = mock(Role.class);
        when(role.getName()).thenReturn(name);
        return role;
    }

    @Test
    void adminAccountReceivesAdminRoleClaim() {
        UserAccount admin = new UserAccount();
        admin.setEmail("admin@carsales.vn");
        admin.addRole(role("ADMIN"));

        String token = service().issue(admin);

        assertEquals("ADMIN", service().parse(token).get("role", String.class));
    }

    @Test
    void customerAccountReceivesCustomerRoleClaim() {
        UserAccount customer = new UserAccount();
        customer.setEmail("customer@carsales.vn");
        customer.addRole(role("CUSTOMER"));

        String token = service().issue(customer);

        assertEquals("CUSTOMER", service().parse(token).get("role", String.class));
    }

    @Test
    void highestPrivilegeRoleWinsWhenAccountHasSeveral() {
        UserAccount staff = new UserAccount();
        staff.setEmail("staff@carsales.vn");
        staff.addRole(role("CUSTOMER"));
        staff.addRole(role("STAFF"));

        String token = service().issue(staff);

        assertEquals("STAFF", service().parse(token).get("role", String.class));
    }
}
