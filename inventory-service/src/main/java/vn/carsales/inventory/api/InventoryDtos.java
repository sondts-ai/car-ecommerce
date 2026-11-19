package vn.carsales.inventory.api;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.carsales.inventory.domain.Branch;
import vn.carsales.inventory.domain.Enums.DocumentType;
import vn.carsales.inventory.domain.Enums.VehicleCondition;
import vn.carsales.inventory.domain.Enums.VehicleStatus;
import vn.carsales.inventory.domain.VehicleDocument;
import vn.carsales.inventory.domain.VehicleImage;
import vn.carsales.inventory.domain.VehicleStatusHistory;

public final class InventoryDtos {
    private InventoryDtos() {
    }

    // ---- Branch ----
    public record BranchRequest(
            @NotBlank(message = "Tên chi nhánh không được để trống") @Size(max = 150, message = "Tên chi nhánh tối đa 150 ký tự") String name,
            @NotBlank(message = "Địa chỉ không được để trống") @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự") String address,
            @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự") String phone) {
    }

    public record BranchResponse(Long id, String name, String address, String phone, LocalDateTime createdAt) {
        public static BranchResponse of(Branch b) {
            return new BranchResponse(b.getId(), b.getName(), b.getAddress(), b.getPhone(), b.getCreatedAt());
        }
    }

    // ---- Vehicle ----
    public record VehicleCreateRequest(
            @NotNull(message = "versionId là bắt buộc") Long versionId,
            @NotNull(message = "branchId là bắt buộc") Long branchId,
            @NotBlank(message = "VIN không được để trống") @Size(min = 17, max = 17, message = "VIN phải đúng 17 ký tự") String vin,
            @Size(max = 20, message = "Biển số tối đa 20 ký tự") String licensePlate,
            @NotNull(message = "Tình trạng xe (condition) là bắt buộc") VehicleCondition condition,
            @NotNull(message = "Năm sản xuất là bắt buộc") @Min(value = 1900, message = "Năm sản xuất phải từ 1900 đến 2100") @Max(value = 2100, message = "Năm sản xuất phải từ 1900 đến 2100") Integer year,
            @Size(max = 50, message = "Màu tối đa 50 ký tự") String color,
            @Min(value = 0, message = "Số km không được âm") Integer mileage,
            @NotNull(message = "Giá là bắt buộc") @DecimalMin(value = "0", message = "Giá không được âm") BigDecimal price,
            String description) {
    }

    public record VehicleUpdateRequest(
            @NotNull(message = "versionId là bắt buộc") Long versionId,
            @NotBlank(message = "VIN không được để trống") @Size(min = 17, max = 17, message = "VIN phải đúng 17 ký tự") String vin,
            @Size(max = 20, message = "Biển số tối đa 20 ký tự") String licensePlate,
            @NotNull(message = "Tình trạng xe (condition) là bắt buộc") VehicleCondition condition,
            @NotNull(message = "Năm sản xuất là bắt buộc") @Min(value = 1900, message = "Năm sản xuất phải từ 1900 đến 2100") @Max(value = 2100, message = "Năm sản xuất phải từ 1900 đến 2100") Integer year,
            @Size(max = 50, message = "Màu tối đa 50 ký tự") String color,
            @Min(value = 0, message = "Số km không được âm") Integer mileage,
            @NotNull(message = "Giá là bắt buộc") @DecimalMin(value = "0", message = "Giá không được âm") BigDecimal price,
            String description) {
    }

    public record VehicleSummary(Long id, String vin, String licensePlate, String name, Long versionId,
                                 Long branchId, String branchName, VehicleCondition condition, Integer year,
                                 String color, Integer mileage, BigDecimal price, VehicleStatus status,
                                 String thumbnailUrl) {
    }

    public record VehicleDetail(Long id, String vin, String licensePlate, String name, Long versionId,
                                BranchResponse branch, VehicleCondition condition, Integer year, String color,
                                Integer mileage, BigDecimal price, String description, VehicleStatus status,
                                LocalDateTime createdAt, LocalDateTime updatedAt, List<ImageResponse> images,
                                List<DocumentResponse> documents) {
    }

    public record StatusRequest(@NotNull(message = "Trạng thái là bắt buộc") VehicleStatus status,
                                @Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason) {
    }

    public record BranchChangeRequest(@NotNull(message = "branchId là bắt buộc") Long branchId,
                                      @Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason) {
    }

    public record HistoryResponse(Long id, Long vehicleId, VehicleStatus oldStatus, VehicleStatus newStatus,
                                  String reason, LocalDateTime createdAt) {
        public static HistoryResponse of(VehicleStatusHistory h) {
            return new HistoryResponse(h.getId(), h.getVehicleId(), h.getOldStatus(), h.getNewStatus(),
                    h.getReason(), h.getCreatedAt());
        }
    }

    // ---- Images / documents ----
    public record ImageRequest(
            @NotBlank(message = "imageUrl không được để trống") @Size(max = 500, message = "imageUrl tối đa 500 ký tự") String imageUrl,
            Boolean isThumbnail,
            @Min(value = 0, message = "sortOrder phải >= 0") Integer sortOrder) {
    }

    public record ImageResponse(Long id, Long vehicleId, String imageUrl, boolean isThumbnail, int sortOrder) {
        public static ImageResponse of(VehicleImage i) {
            return new ImageResponse(i.getId(), i.getVehicleId(), i.getImageUrl(), i.isThumbnail(), i.getSortOrder());
        }
    }

    public record DocumentRequest(
            @NotNull(message = "documentType là bắt buộc") DocumentType documentType,
            @NotBlank(message = "fileUrl không được để trống") @Size(max = 500, message = "fileUrl tối đa 500 ký tự") String fileUrl) {
    }

    public record DocumentResponse(Long id, Long vehicleId, DocumentType documentType, String fileUrl,
                                   LocalDateTime createdAt) {
        public static DocumentResponse of(VehicleDocument d) {
            return new DocumentResponse(d.getId(), d.getVehicleId(), d.getDocumentType(), d.getFileUrl(),
                    d.getCreatedAt());
        }
    }

    // ---- Stats ----
    public record BranchCount(Long branchId, String branchName, long count) {
    }

    public record VehicleStats(long total, Map<String, Long> byStatus, List<BranchCount> byBranch,
                               Map<String, Long> byCondition) {
    }

    // ---- Internal ----
    public record InternalVehicle(Long id, String vin, String name, Long versionId, VehicleCondition condition,
                                  Integer year, String color, Integer mileage, BigDecimal price,
                                  VehicleStatus status, String branchName, String thumbnailUrl) {
    }
}
