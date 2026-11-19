package vn.carsales.car.service;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import vn.carsales.car.api.CarDtos.CategoryRequest;
import vn.carsales.car.api.CarDtos.CategoryResponse;
import vn.carsales.car.api.PageResponse;
import vn.carsales.car.domain.Category;
import vn.carsales.car.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categories;

    public CategoryService(CategoryRepository categories) {
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> list(String q, int page, int size) {
        Page<Category> result = categories.search(q == null ? "" : q.trim(), PageResponse.pageable(page, size));
        return PageResponse.of(result, CategoryResponse::of);
    }

    @Transactional(readOnly = true)
    public CategoryResponse get(Long id) {
        return CategoryResponse.of(find(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        String name = req.name().trim();
        if (categories.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên phân loại đã tồn tại");
        }
        Category c = new Category();
        c.setName(name);
        c.setDescription(req.description());
        return CategoryResponse.of(categories.saveAndFlush(c));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category c = find(id);
        String name = req.name().trim();
        if (categories.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên phân loại đã tồn tại");
        }
        c.setName(name);
        c.setDescription(req.description());
        return CategoryResponse.of(categories.saveAndFlush(c));
    }

    /** Xóa phân loại sẽ tự gỡ khỏi các dòng xe (bảng trung gian ON DELETE CASCADE). */
    @Transactional
    public void delete(Long id) {
        find(id);
        categories.detachFromModels(id);
        Category c = find(id);
        categories.delete(c);
        categories.flush();
    }

    private Category find(Long id) {
        return categories.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phân loại"));
    }
}
