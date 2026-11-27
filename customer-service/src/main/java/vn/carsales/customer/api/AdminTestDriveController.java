package vn.carsales.customer.api;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.carsales.customer.security.CustomerPrincipal;
import vn.carsales.customer.service.TestDriveService;

@RestController
@RequestMapping("/api/v1/admin/test-drives")
public class AdminTestDriveController {
    private final TestDriveService testDrives;

    public AdminTestDriveController(TestDriveService testDrives) {
        this.testDrives = testDrives;
    }

    @GetMapping
    public ApiResponse<TestDriveDtos.ListView> list(Authentication authentication) {
        requireAdmin(authentication);
        return ApiResponse.ok("All test drives", testDrives.listAll());
    }

    @PutMapping("/{id}/status")
    public ApiResponse<TestDriveDtos.View> updateStatus(Authentication authentication,
                                                        @PathVariable Long id,
                                                        @Valid @RequestBody TestDriveDtos.StatusInput input) {
        requireAdmin(authentication);
        return ApiResponse.ok("Test drive status updated", testDrives.updateStatus(id, input.status()));
    }

    private void requireAdmin(Authentication authentication) {
        CustomerPrincipal principal = (CustomerPrincipal) authentication.getPrincipal();
        if (!"ADMIN".equals(principal.role())) {
            throw new org.springframework.security.access.AccessDeniedException("ADMIN role is required");
        }
    }
}
