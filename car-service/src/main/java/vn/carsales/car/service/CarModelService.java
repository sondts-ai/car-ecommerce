package vn.carsales.car.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.criteria.Predicate;
import vn.carsales.car.api.CarDtos.CategoryResponse;
import vn.carsales.car.api.CarDtos.ImageRequest;
import vn.carsales.car.api.CarDtos.ImageResponse;
import vn.carsales.car.api.CarDtos.InternalVersionResponse;
import vn.carsales.car.api.CarDtos.ModelDetail;
import vn.carsales.car.api.CarDtos.ModelRequest;
import vn.carsales.car.api.CarDtos.ModelSummary;
import vn.carsales.car.api.CarDtos.VersionRequest;
import vn.carsales.car.api.CarDtos.VersionResponse;
import vn.carsales.car.api.PageResponse;
import vn.carsales.car.domain.Brand;
import vn.carsales.car.domain.CarImage;
import vn.carsales.car.domain.CarModel;
import vn.carsales.car.domain.CarVersion;
import vn.carsales.car.domain.Category;
import vn.carsales.car.repository.BrandRepository;
import vn.carsales.car.repository.CarImageRepository;
import vn.carsales.car.repository.CarModelRepository;
import vn.carsales.car.repository.CarVersionRepository;
import vn.carsales.car.repository.CategoryRepository;

/** Dòng xe + phiên bản + ảnh dòng xe. */
@Service
public class CarModelService {

    private final CarModelRepository models;
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final CarVersionRepository versions;
    private final CarImageRepository images;

    public CarModelService(CarModelRepository models, BrandRepository brands, CategoryRepository categories,
                           CarVersionRepository versions, CarImageRepository images) {
        this.models = models;
        this.brands = brands;
        this.categories = categories;
        this.versions = versions;
        this.images = images;
    }

    // ------------------------------------------------------------------ models

    @Transactional(readOnly = true)
    public PageResponse<ModelSummary> list(Long brandId, Long categoryId, String q, int page, int size) {
        Specification<CarModel> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (brandId != null) {
                ps.add(cb.equal(root.get("brand").get("id"), brandId));
            }
            if (categoryId != null) {
                ps.add(cb.equal(root.join("categories").get("id"), categoryId));
                query.distinct(true);
            }
            if (q != null && !q.isBlank()) {
                ps.add(cb.like(cb.lower(root.get("name")), "%" + q.trim().toLowerCase() + "%"));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<CarModel> result = models.findAll(spec, PageResponse.pageable(page, size));
        List<Long> ids = result.getContent().stream().map(CarModel::getId).toList();
        Map<Long, String> thumbs = ids.isEmpty() ? Map.of() : images.findThumbnails(ids).stream()
                .collect(Collectors.toMap(CarImage::getModelId, CarImage::getImageUrl, (a, b) -> a));
        return PageResponse.of(result, m -> summary(m, thumbs.get(m.getId())));
    }

    @Transactional(readOnly = true)
    public ModelDetail get(Long id) {
        CarModel m = findModel(id);
        List<ImageResponse> imgs = images.findByModelIdOrderBySortOrderAscIdAsc(id).stream()
                .map(ImageResponse::of).toList();
        String thumb = imgs.stream().filter(ImageResponse::isThumbnail).map(ImageResponse::imageUrl)
                .findFirst().orElse(null);
        List<VersionResponse> vs = versions.findByModelIdOrderByIdAsc(id).stream().map(VersionResponse::of).toList();
        return new ModelDetail(m.getId(), m.getBrand().getId(), m.getBrand().getName(), m.getName(),
                m.getDescription(), categoryList(m), thumb, m.getCreatedAt(), vs, imgs);
    }

    @Transactional
    public ModelSummary create(ModelRequest req) {
        Brand brand = findBrandForBody(req.brandId());
        String name = req.name().trim();
        if (models.existsByBrandIdAndNameIgnoreCase(brand.getId(), name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dòng xe đã tồn tại trong hãng này");
        }
        CarModel m = new CarModel();
        m.setBrand(brand);
        m.setName(name);
        m.setDescription(req.description());
        m.getCategories().addAll(findCategories(req.categoryIds()));
        m = models.saveAndFlush(m);
        return summary(m, null);
    }

    @Transactional
    public ModelSummary update(Long id, ModelRequest req) {
        CarModel m = findModel(id);
        Brand brand = findBrandForBody(req.brandId());
        String name = req.name().trim();
        if (models.existsByBrandIdAndNameIgnoreCaseAndIdNot(brand.getId(), name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Dòng xe đã tồn tại trong hãng này");
        }
        m.setBrand(brand);
        m.setName(name);
        m.setDescription(req.description());
        m.getCategories().clear();
        m.getCategories().addAll(findCategories(req.categoryIds()));
        m = models.saveAndFlush(m);
        String thumb = images.findThumbnails(List.of(id)).stream().map(CarImage::getImageUrl).findFirst().orElse(null);
        return summary(m, thumb);
    }

    @Transactional
    public void delete(Long id) {
        CarModel m = findModel(id);
        if (versions.existsByModelId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa dòng xe còn phiên bản");
        }
        images.deleteByModelId(id);
        models.delete(m);
        models.flush();
    }

    // ---------------------------------------------------------------- versions

    @Transactional(readOnly = true)
    public List<VersionResponse> listVersions(Long modelId) {
        findModel(modelId);
        return versions.findByModelIdOrderByIdAsc(modelId).stream().map(VersionResponse::of).toList();
    }

    @Transactional
    public VersionResponse createVersion(Long modelId, VersionRequest req) {
        CarModel m = findModel(modelId);
        String name = req.versionName().trim();
        if (versions.existsByModelIdAndVersionNameIgnoreCase(modelId, name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên phiên bản đã tồn tại trong dòng xe này");
        }
        CarVersion v = new CarVersion();
        v.setModel(m);
        applyVersion(v, req, name);
        return VersionResponse.of(versions.saveAndFlush(v));
    }

    @Transactional
    public VersionResponse updateVersion(Long id, VersionRequest req) {
        CarVersion v = findVersion(id);
        String name = req.versionName().trim();
        if (versions.existsByModelIdAndVersionNameIgnoreCaseAndIdNot(v.getModel().getId(), name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên phiên bản đã tồn tại trong dòng xe này");
        }
        applyVersion(v, req, name);
        return VersionResponse.of(versions.saveAndFlush(v));
    }

    /** Lưu ý: car-service không biết xe nào ở inventory-service đang dùng phiên bản này (xem README). */
    @Transactional
    public void deleteVersion(Long id) {
        CarVersion v = findVersion(id);
        versions.delete(v);
        versions.flush();
    }

    @Transactional(readOnly = true)
    public InternalVersionResponse internalVersion(Long id) {
        CarVersion v = versions.findDetailById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên bản xe"));
        CarModel m = v.getModel();
        return new InternalVersionResponse(v.getId(), v.getVersionName(), m.getId(), m.getName(),
                m.getBrand().getId(), m.getBrand().getName(), v.getFuelType(), v.getTransmission(), v.getSeats());
    }

    // ------------------------------------------------------------------ images

    @Transactional
    public ImageResponse addImage(Long modelId, ImageRequest req) {
        findModel(modelId);
        boolean thumb = Boolean.TRUE.equals(req.isThumbnail());
        if (thumb) {
            images.clearThumbnail(modelId);
        }
        CarImage img = new CarImage();
        img.setModelId(modelId);
        img.setImageUrl(req.imageUrl().trim());
        img.setThumbnail(thumb);
        img.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        return ImageResponse.of(images.saveAndFlush(img));
    }

    /** Bỏ thumbnail cũ và đặt thumbnail mới trong cùng một transaction. */
    @Transactional
    public ImageResponse setThumbnail(Long imageId) {
        CarImage img = findImage(imageId);
        images.clearThumbnail(img.getModelId());
        img = findImage(imageId); // clearThumbnail đã clear persistence context
        img.setThumbnail(true);
        return ImageResponse.of(images.saveAndFlush(img));
    }

    @Transactional
    public void deleteImage(Long imageId) {
        images.delete(findImage(imageId));
        images.flush();
    }

    // ----------------------------------------------------------------- helpers

    private CarModel findModel(Long id) {
        return models.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy dòng xe"));
    }

    private CarVersion findVersion(Long id) {
        return versions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên bản xe"));
    }

    private CarImage findImage(Long id) {
        return images.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh"));
    }

    private Brand findBrandForBody(Long brandId) {
        return brands.findById(brandId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hãng xe không tồn tại"));
    }

    private List<Category> findCategories(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        Set<Long> unique = new HashSet<>(ids);
        List<Category> found = categories.findAllById(unique);
        if (found.size() != unique.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Có phân loại không tồn tại");
        }
        return found;
    }

    private void applyVersion(CarVersion v, VersionRequest req, String name) {
        v.setVersionName(name);
        v.setEngine(req.engine());
        v.setTransmission(req.transmission());
        v.setFuelType(req.fuelType());
        v.setSeats(req.seats());
    }

    private List<CategoryResponse> categoryList(CarModel m) {
        return m.getCategories().stream().map(CategoryResponse::of)
                .sorted(java.util.Comparator.comparing(CategoryResponse::id)).toList();
    }

    private ModelSummary summary(CarModel m, String thumbnailUrl) {
        return new ModelSummary(m.getId(), m.getBrand().getId(), m.getBrand().getName(), m.getName(),
                m.getDescription(), categoryList(m), thumbnailUrl, m.getCreatedAt());
    }
}
