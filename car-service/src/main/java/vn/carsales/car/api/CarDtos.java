package vn.carsales.car.api;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.carsales.car.domain.Brand;
import vn.carsales.car.domain.CarVersion;
import vn.carsales.car.domain.Category;
import vn.carsales.car.domain.FuelType;
import vn.carsales.car.domain.Transmission;

/** Tập hợp request/response của car-service. */
public final class CarDtos {
    private CarDtos() {
    }

    // ---- Brand ----
    public record BrandRequest(
            @NotBlank(message = "Tên hãng không được để trống") @Size(max = 120, message = "Tên hãng tối đa 120 ký tự") String name,
            @Size(max = 500, message = "Logo URL tối đa 500 ký tự") String logoUrl,
            String description) {
    }

    public record BrandResponse(Long id, String name, String logoUrl, String description, LocalDateTime createdAt) {
        public static BrandResponse of(Brand b) {
            return new BrandResponse(b.getId(), b.getName(), b.getLogoUrl(), b.getDescription(), b.getCreatedAt());
        }
    }

    // ---- Category ----
    public record CategoryRequest(
            @NotBlank(message = "Tên phân loại không được để trống") @Size(max = 100, message = "Tên phân loại tối đa 100 ký tự") String name,
            @Size(max = 255, message = "Mô tả tối đa 255 ký tự") String description) {
    }

    public record CategoryResponse(Long id, String name, String description, LocalDateTime createdAt) {
        public static CategoryResponse of(Category c) {
            return new CategoryResponse(c.getId(), c.getName(), c.getDescription(), c.getCreatedAt());
        }
    }

    // ---- Car model ----
    public record ModelRequest(
            @NotNull(message = "brandId là bắt buộc") Long brandId,
            @NotBlank(message = "Tên dòng xe không được để trống") @Size(max = 150, message = "Tên dòng xe tối đa 150 ký tự") String name,
            String description,
            List<Long> categoryIds) {
    }

    public record ModelSummary(Long id, Long brandId, String brandName, String name, String description,
                               List<CategoryResponse> categories, LocalDateTime createdAt) {
    }

    public record ModelDetail(Long id, Long brandId, String brandName, String name, String description,
                              List<CategoryResponse> categories, LocalDateTime createdAt,
                              List<VersionResponse> versions) {
    }

    // ---- Version ----
    public record VersionRequest(
            @NotBlank(message = "Tên phiên bản không được để trống") @Size(max = 150, message = "Tên phiên bản tối đa 150 ký tự") String versionName,
            @Size(max = 100, message = "Động cơ tối đa 100 ký tự") String engine,
            Transmission transmission,
            FuelType fuelType,
            @Min(value = 2, message = "Số chỗ ngồi phải từ 2 đến 60") @Max(value = 60, message = "Số chỗ ngồi phải từ 2 đến 60") Integer seats) {
    }

    public record VersionResponse(Long id, Long modelId, String versionName, String engine,
                                  Transmission transmission, FuelType fuelType, Integer seats,
                                  LocalDateTime createdAt) {
        public static VersionResponse of(CarVersion v) {
            return new VersionResponse(v.getId(), v.getModel().getId(), v.getVersionName(), v.getEngine(),
                    v.getTransmission(), v.getFuelType(), v.getSeats(), v.getCreatedAt());
        }
    }

    public record InternalVersionResponse(Long versionId, String versionName, Long modelId, String modelName,
                                          Long brandId, String brandName, FuelType fuelType,
                                          Transmission transmission, Integer seats) {
    }
}
