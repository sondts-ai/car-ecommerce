package vn.carsales.customer.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.carsales.customer.security.CustomerPrincipal;
import vn.carsales.customer.service.TestDriveService;

@RestController
@RequestMapping("/api/v1/test-drives")
public class TestDriveController {
    private final TestDriveService testDrives;

    public TestDriveController(TestDriveService testDrives) {
        this.testDrives = testDrives;
    }

    @GetMapping
    public ApiResponse<TestDriveDtos.ListView> list(Authentication authentication) {
        return ApiResponse.ok("Customer test drives", testDrives.listForCustomer(principal(authentication).userId()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TestDriveDtos.View> create(Authentication authentication,
                                                   @Valid @RequestBody TestDriveDtos.CreateInput input) {
        return ApiResponse.ok("Test drive request submitted for admin approval",
                testDrives.create(customerUserId(authentication), input));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<TestDriveDtos.View> cancel(Authentication authentication, @PathVariable Long id) {
        CustomerPrincipal customer = principal(authentication);
        return ApiResponse.ok("Test drive cancelled", testDrives.cancelForCustomer(customer.userId(), id));
    }

    @GetMapping("/slots")
    public ApiResponse<TestDriveDtos.SlotsView> slots(@RequestParam String carSlug,
                                                       @RequestParam String showroomId,
                                                       @RequestParam String date) {
        return ApiResponse.ok("Test drive slots", testDrives.slots(carSlug, showroomId, date));
    }

    private CustomerPrincipal principal(Authentication authentication) {
        return (CustomerPrincipal) authentication.getPrincipal();
    }

    private Long customerUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof CustomerPrincipal principal
                && "CUSTOMER".equals(principal.role())) {
            return principal.userId();
        }
        return null;
    }
}
