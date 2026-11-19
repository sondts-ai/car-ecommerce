package vn.carsales.car.api;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import vn.carsales.car.api.CarDtos.BrandRequest;
import vn.carsales.car.api.CarDtos.BrandResponse;
import vn.carsales.car.api.CarDtos.CategoryRequest;
import vn.carsales.car.api.CarDtos.CategoryResponse;
import vn.carsales.car.api.CarDtos.ImageRequest;
import vn.carsales.car.api.CarDtos.ImageResponse;
import vn.carsales.car.api.CarDtos.InternalVersionResponse;
import vn.carsales.car.api.CarDtos.ModelDetail;
import vn.carsales.car.api.CarDtos.ModelRequest;
import vn.carsales.car.api.CarDtos.ModelSummary;
import vn.carsales.car.api.CarDtos.VersionRequest;
import vn.carsales.car.api.CarDtos.VersionResponse;
import vn.carsales.car.service.BrandService;
import vn.carsales.car.service.CarModelService;
import vn.carsales.car.service.CategoryService;

/** Toàn bộ API admin (/api/v1/admin/**) và API nội bộ (/api/v1/internal/**) của car-service. */
@RestController
@RequestMapping("/api/v1")
public class AdminController {

    private final BrandService brands;
    private final CategoryService categories;
    private final CarModelService models;

    public AdminController(BrandService brands, CategoryService categories, CarModelService models) {
        this.brands = brands;
        this.categories = categories;
        this.models = models;
    }

    private static <T> ResponseEntity<ApiResponse<T>> created(String msg, T data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(msg, data));
    }

    // ------------------------------------------------------------------ brands

    @GetMapping("/admin/brands")
    public ApiResponse<PageResponse<BrandResponse>> listBrands(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách hãng xe", brands.list(q, page, size));
    }

    @PostMapping("/admin/brands")
    public ResponseEntity<ApiResponse<BrandResponse>> createBrand(@Valid @RequestBody BrandRequest req) {
        return created("Tạo hãng xe thành công", brands.create(req));
    }

    @GetMapping("/admin/brands/{id}")
    public ApiResponse<BrandResponse> getBrand(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết hãng xe", brands.get(id));
    }

    @PutMapping("/admin/brands/{id}")
    public ApiResponse<BrandResponse> updateBrand(@PathVariable Long id, @Valid @RequestBody BrandRequest req) {
        return ApiResponse.ok("Cập nhật hãng xe thành công", brands.update(id, req));
    }

    @DeleteMapping("/admin/brands/{id}")
    public ApiResponse<Void> deleteBrand(@PathVariable Long id) {
        brands.delete(id);
        return ApiResponse.ok("Xóa hãng xe thành công", null);
    }

    // -------------------------------------------------------------- categories

    @GetMapping("/admin/categories")
    public ApiResponse<PageResponse<CategoryResponse>> listCategories(@RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách phân loại", categories.list(q, page, size));
    }

    @PostMapping("/admin/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest req) {
        return created("Tạo phân loại thành công", categories.create(req));
    }

    @GetMapping("/admin/categories/{id}")
    public ApiResponse<CategoryResponse> getCategory(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết phân loại", categories.get(id));
    }

    @PutMapping("/admin/categories/{id}")
    public ApiResponse<CategoryResponse> updateCategory(@PathVariable Long id,
            @Valid @RequestBody CategoryRequest req) {
        return ApiResponse.ok("Cập nhật phân loại thành công", categories.update(id, req));
    }

    @DeleteMapping("/admin/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categories.delete(id);
        return ApiResponse.ok("Xóa phân loại thành công", null);
    }

    // -------------------------------------------------------------- car models

    @GetMapping("/admin/car-models")
    public ApiResponse<PageResponse<ModelSummary>> listModels(@RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId, @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Danh sách dòng xe", models.list(brandId, categoryId, q, page, size));
    }

    @PostMapping("/admin/car-models")
    public ResponseEntity<ApiResponse<ModelSummary>> createModel(@Valid @RequestBody ModelRequest req) {
        return created("Tạo dòng xe thành công", models.create(req));
    }

    @GetMapping("/admin/car-models/{id}")
    public ApiResponse<ModelDetail> getModel(@PathVariable Long id) {
        return ApiResponse.ok("Chi tiết dòng xe", models.get(id));
    }

    @PutMapping("/admin/car-models/{id}")
    public ApiResponse<ModelSummary> updateModel(@PathVariable Long id, @Valid @RequestBody ModelRequest req) {
        return ApiResponse.ok("Cập nhật dòng xe thành công", models.update(id, req));
    }

    @DeleteMapping("/admin/car-models/{id}")
    public ApiResponse<Void> deleteModel(@PathVariable Long id) {
        models.delete(id);
        return ApiResponse.ok("Xóa dòng xe thành công", null);
    }

    // ---------------------------------------------------------------- versions

    @GetMapping("/admin/car-models/{id}/versions")
    public ApiResponse<List<VersionResponse>> listVersions(@PathVariable Long id) {
        return ApiResponse.ok("Danh sách phiên bản", models.listVersions(id));
    }

    @PostMapping("/admin/car-models/{id}/versions")
    public ResponseEntity<ApiResponse<VersionResponse>> createVersion(@PathVariable Long id,
            @Valid @RequestBody VersionRequest req) {
        return created("Tạo phiên bản thành công", models.createVersion(id, req));
    }

    @PutMapping("/admin/versions/{id}")
    public ApiResponse<VersionResponse> updateVersion(@PathVariable Long id, @Valid @RequestBody VersionRequest req) {
        return ApiResponse.ok("Cập nhật phiên bản thành công", models.updateVersion(id, req));
    }

    @DeleteMapping("/admin/versions/{id}")
    public ApiResponse<Void> deleteVersion(@PathVariable Long id) {
        models.deleteVersion(id);
        return ApiResponse.ok("Xóa phiên bản thành công", null);
    }

    // ------------------------------------------------------------------ images

    @PostMapping("/admin/car-models/{id}/images")
    public ResponseEntity<ApiResponse<ImageResponse>> addImage(@PathVariable Long id,
            @Valid @RequestBody ImageRequest req) {
        return created("Thêm ảnh thành công", models.addImage(id, req));
    }

    @PatchMapping("/admin/car-images/{id}/thumbnail")
    public ApiResponse<ImageResponse> setThumbnail(@PathVariable Long id) {
        return ApiResponse.ok("Đặt ảnh đại diện thành công", models.setThumbnail(id));
    }

    @DeleteMapping("/admin/car-images/{id}")
    public ApiResponse<Void> deleteImage(@PathVariable Long id) {
        models.deleteImage(id);
        return ApiResponse.ok("Xóa ảnh thành công", null);
    }

    // ---------------------------------------------------------------- internal

    @GetMapping("/internal/versions/{id}")
    public ApiResponse<InternalVersionResponse> internalVersion(@PathVariable Long id) {
        return ApiResponse.ok("Thông tin phiên bản xe", models.internalVersion(id));
    }
}
