package vn.carsales.car.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.criteria.Predicate;
import vn.carsales.car.api.CarDtos.CategoryResponse;
import vn.carsales.car.api.CarDtos.InternalVersionResponse;
import vn.carsales.car.api.CarDtos.ModelDetail;
import vn.carsales.car.api.CarDtos.ModelRequest;
import vn.carsales.car.api.CarDtos.ModelSummary;
import vn.carsales.car.api.CarDtos.VersionRequest;
import vn.carsales.car.api.CarDtos.VersionResponse;
import vn.carsales.car.api.PageResponse;
import vn.carsales.car.domain.Brand;
import vn.carsales.car.domain.CarModel;
import vn.carsales.car.domain.CarVersion;
import vn.carsales.car.domain.Category;
import vn.carsales.car.repository.BrandRepository;
import vn.carsales.car.repository.CarModelRepository;
import vn.carsales.car.repository.CarVersionRepository;
import vn.carsales.car.repository.CategoryRepository;

/** Dòng xe + phiên bản. */
@Service
public class CarModelService {

    private final CarModelRepository models;
    private final BrandRepository brands;
    private final CategoryRepository categories;
    private final CarVersionRepository versions;

    public CarModelService(CarModelRepository models, BrandRepository brands, CategoryRepository categories,
                           CarVersionRepository versions) {
        this.models = models;
        this.brands = brands;
        this.categories = categories;
        this.versions = versions;
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
        return PageResponse.of(result, this::summary);
    }

    @Transactional(readOnly = true)
    public ModelDetail get(Long id) {
        CarModel m = findModel(id);
        List<VersionResponse> vs = versions.findByModelIdOrderByIdAsc(id).stream().map(VersionResponse::of).toList();
        return new ModelDetail(m.getId(), m.getBrand().getId(), m.getBrand().getName(), m.getName(),
                m.getDescription(), categoryList(m), m.getCreatedAt(), vs);
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
        return summary(models.saveAndFlush(m));
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
        return summary(models.saveAndFlush(m));
    }

    @Transactional
    public void delete(Long id) {
        CarModel m = findModel(id);
        if (versions.existsByModelId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa dòng xe còn phiên bản");
        }
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

    /** Bảng vehicles có khóa ngoại tới car_versions (RESTRICT) nên phiên bản đang có xe sẽ bị chặn (409). */
    @Transactional
    public void deleteVersion(Long id) {
        CarVersion v = findVersion(id);
        try {
            versions.delete(v);
            versions.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa phiên bản đang có xe");
        }
    }

    @Transactional(readOnly = true)
    public InternalVersionResponse internalVersion(Long id) {
        CarVersion v = versions.findDetailById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phiên bản xe"));
        CarModel m = v.getModel();
        return new InternalVersionResponse(v.getId(), v.getVersionName(), m.getId(), m.getName(),
                m.getBrand().getId(), m.getBrand().getName(), v.getFuelType(), v.getTransmission(), v.getSeats());
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
                .sorted(Comparator.comparing(CategoryResponse::id)).toList();
    }

    private ModelSummary summary(CarModel m) {
        return new ModelSummary(m.getId(), m.getBrand().getId(), m.getBrand().getName(), m.getName(),
                m.getDescription(), categoryList(m), m.getCreatedAt());
    }
}
