package vn.carsales.inventory.api;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.carsales.inventory.api.InventoryDtos.BranchChangeRequest;
import vn.carsales.inventory.api.InventoryDtos.BranchRequest;
import vn.carsales.inventory.api.InventoryDtos.BranchResponse;
import vn.carsales.inventory.api.InventoryDtos.DocumentRequest;
import vn.carsales.inventory.api.InventoryDtos.DocumentResponse;
import vn.carsales.inventory.api.InventoryDtos.HistoryResponse;
import vn.carsales.inventory.api.InventoryDtos.HoldResponse;
import vn.carsales.inventory.api.InventoryDtos.ImageRequest;
import vn.carsales.inventory.api.InventoryDtos.ImageResponse;
import vn.carsales.inventory.api.InventoryDtos.InternalVehicle;
import vn.carsales.inventory.api.InventoryDtos.ReleaseRequest;
import vn.carsales.inventory.api.InventoryDtos.StatusRequest;
import vn.carsales.inventory.api.InventoryDtos.VehicleCreateRequest;
import vn.carsales.inventory.api.InventoryDtos.VehicleDetail;
import vn.carsales.inventory.api.InventoryDtos.VehicleStats;
import vn.carsales.inventory.api.InventoryDtos.VehicleSummary;
import vn.carsales.inventory.api.InventoryDtos.VehicleUpdateRequest;
import vn.carsales.inventory.domain.Enums.HoldStatus;
import vn.carsales.inventory.domain.Enums.VehicleCondition;
import vn.carsales.inventory.domain.Enums.VehicleStatus;
import vn.carsales.inventory.security.AuthUser;
import vn.carsales.inventory.service.BranchService;
import vn.carsales.inventory.service.HoldService;
import vn.carsales.inventory.service.VehicleService;

/** API admin (/api/v1/admin/**) và nội bộ (/api/v1/internal/**) của inventory-service. */
@RestController
@RequestMapping("/api/v1")
public class AdminController {

    private final VehicleService vehicles;
    private final BranchService branches;
    private final HoldService holds;

    public AdminController(VehicleService vehicles, BranchService branches, HoldService holds) {
        this.vehicles = vehicles;
        this.branches = branches;
        this.holds = holds;
    }

    private static <T> ResponseEntity<ApiResponse<T>> created(String msg, T data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(msg, data));
    }

    // ---------------------------------------------------------------- vehicles

    @GetMapping("/admin/vehicles")
    public ApiResponse<PageResponse<VehicleSummary>> listVehicles(
            @RequestParam(required = false) VehicleStatus status,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long versionId,
            @RequestParam(required = false) VehicleCondition condition,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách xe",
                vehicles.list(status, branchId, versionId, condition, minPrice, maxPrice, q, page, size));
    }

    @PostMapping("/admin/vehicles")
    public ResponseEntity<ApiResponse<VehicleDetail>> createVehicle(@Valid @RequestBody VehicleCreateRequest req,
            @AuthenticationPrincipal AuthUser user) {
        return created("Nhập xe thành công", vehicles.create(req, user.userId()));
    }

    @GetMapping("/admin/vehicles/{id}")
    public ApiResponse<VehicleDetail> getVehicle(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết xe", vehicles.get(id));
    }

    @PutMapping("/admin/vehicles/{id}")
    public ApiResponse<VehicleDetail> updateVehicle(@PathVariable Long id,
            @Valid @RequestBody VehicleUpdateRequest req) {
        return ApiResponse.ok("Cập nhật xe thành công", vehicles.update(id, req));
    }

    @DeleteMapping("/admin/vehicles/{id}")
    public ApiResponse<Void> deleteVehicle(@PathVariable Long id) {
        vehicles.delete(id);
        return ApiResponse.ok("Xóa xe thành công", null);
    }

    @PatchMapping("/admin/vehicles/{id}/status")
    public ApiResponse<HistoryResponse> changeStatus(@PathVariable Long id, @Valid @RequestBody StatusRequest req,
            @AuthenticationPrincipal AuthUser user) {
        return ApiResponse.ok("Đổi trạng thái xe thành công", vehicles.changeStatus(id, req, user.userId()));
    }

    @GetMapping("/admin/vehicles/{id}/history")
    public ApiResponse<List<HistoryResponse>> history(@PathVariable Long id) {
        return ApiResponse.ok("Lịch sử trạng thái xe", vehicles.history(id));
    }

    @PatchMapping("/admin/vehicles/{id}/branch")
    public ApiResponse<HistoryResponse> changeBranch(@PathVariable Long id,
            @Valid @RequestBody BranchChangeRequest req, @AuthenticationPrincipal AuthUser user) {
        return ApiResponse.ok("Chuyển chi nhánh thành công", vehicles.changeBranch(id, req, user.userId()));
    }

    // ------------------------------------------------------ images / documents

    @PostMapping("/admin/vehicles/{id}/images")
    public ResponseEntity<ApiResponse<ImageResponse>> addImage(@PathVariable Long id,
            @Valid @RequestBody ImageRequest req) {
        return created("Thêm ảnh thành công", vehicles.addImage(id, req));
    }

    @PatchMapping("/admin/vehicle-images/{id}/thumbnail")
    public ApiResponse<ImageResponse> setThumbnail(@PathVariable Long id) {
        return ApiResponse.ok("Đặt ảnh đại diện thành công", vehicles.setThumbnail(id));
    }

    @DeleteMapping("/admin/vehicle-images/{id}")
    public ApiResponse<Void> deleteImage(@PathVariable Long id) {
        vehicles.deleteImage(id);
        return ApiResponse.ok("Xóa ảnh thành công", null);
    }

    @PostMapping("/admin/vehicles/{id}/documents")
    public ResponseEntity<ApiResponse<DocumentResponse>> addDocument(@PathVariable Long id,
            @Valid @RequestBody DocumentRequest req) {
        return created("Thêm giấy tờ thành công", vehicles.addDocument(id, req));
    }

    @DeleteMapping("/admin/vehicle-documents/{id}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {
        vehicles.deleteDocument(id);
        return ApiResponse.ok("Xóa giấy tờ thành công", null);
    }

    // ---------------------------------------------------------------- branches

    @GetMapping("/admin/branches")
    public ApiResponse<PageResponse<BranchResponse>> listBranches(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách chi nhánh", branches.list(q, page, size));
    }

    @PostMapping("/admin/branches")
    public ResponseEntity<ApiResponse<BranchResponse>> createBranch(@Valid @RequestBody BranchRequest req) {
        return created("Tạo chi nhánh thành công", branches.create(req));
    }

    @GetMapping("/admin/branches/{id}")
    public ApiResponse<BranchResponse> getBranch(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết chi nhánh", branches.get(id));
    }

    @PutMapping("/admin/branches/{id}")
    public ApiResponse<BranchResponse> updateBranch(@PathVariable Long id, @Valid @RequestBody BranchRequest req) {
        return ApiResponse.ok("Cập nhật chi nhánh thành công", branches.update(id, req));
    }

    @DeleteMapping("/admin/branches/{id}")
    public ApiResponse<Void> deleteBranch(@PathVariable Long id) {
        branches.delete(id);
        return ApiResponse.ok("Xóa chi nhánh thành công", null);
    }

    // ------------------------------------------------------------------- holds

    @GetMapping("/admin/holds")
    public ApiResponse<PageResponse<HoldResponse>> listHolds(@RequestParam(required = false) HoldStatus status,
            @RequestParam(required = false) Long vehicleId, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách lượt giữ xe", holds.list(status, vehicleId, page, size));
    }

    @PostMapping("/admin/holds/{id}/release")
    public ApiResponse<HoldResponse> release(@PathVariable Long id, @Valid @RequestBody(required = false) ReleaseRequest req,
            @AuthenticationPrincipal AuthUser user) {
        return ApiResponse.ok("Giải phóng lượt giữ xe thành công",
                holds.release(id, req == null ? null : req.reason(), user.userId()));
    }

    // ------------------------------------------------------------------- stats

    @GetMapping("/admin/stats/vehicles")
    public ApiResponse<VehicleStats> stats() {
        return ApiResponse.ok("Thống kê xe", vehicles.stats());
    }

    // ---------------------------------------------------------------- internal

    @GetMapping("/internal/vehicles/{id}")
    public ApiResponse<InternalVehicle> internalVehicle(@PathVariable Long id) {
        return ApiResponse.ok("Thông tin xe", vehicles.internal(id));
    }
}
