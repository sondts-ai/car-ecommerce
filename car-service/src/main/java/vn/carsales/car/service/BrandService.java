package vn.carsales.car.service;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import vn.carsales.car.api.CarDtos.BrandRequest;
import vn.carsales.car.api.CarDtos.BrandResponse;
import vn.carsales.car.api.PageResponse;
import vn.carsales.car.domain.Brand;
import vn.carsales.car.repository.BrandRepository;
import vn.carsales.car.repository.CarModelRepository;

@Service
public class BrandService {

    private final BrandRepository brands;
    private final CarModelRepository models;

    public BrandService(BrandRepository brands, CarModelRepository models) {
        this.brands = brands;
        this.models = models;
    }

    @Transactional(readOnly = true)
    public PageResponse<BrandResponse> list(String q, int page, int size) {
        Page<Brand> result = brands.search(q == null ? "" : q.trim(), PageResponse.pageable(page, size));
        return PageResponse.of(result, BrandResponse::of);
    }

    @Transactional(readOnly = true)
    public BrandResponse get(Long id) {
        return BrandResponse.of(find(id));
    }

    @Transactional
    public BrandResponse create(BrandRequest req) {
        String name = req.name().trim();
        if (brands.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên hãng đã tồn tại");
        }
        Brand b = new Brand();
        apply(b, req, name);
        return BrandResponse.of(brands.saveAndFlush(b));
    }

    @Transactional
    public BrandResponse update(Long id, BrandRequest req) {
        Brand b = find(id);
        String name = req.name().trim();
        if (brands.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên hãng đã tồn tại");
        }
        apply(b, req, name);
        return BrandResponse.of(brands.saveAndFlush(b));
    }

    @Transactional
    public void delete(Long id) {
        Brand b = find(id);
        if (models.existsByBrandId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa hãng còn dòng xe");
        }
        brands.delete(b);
        brands.flush();
    }

    private Brand find(Long id) {
        return brands.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hãng xe"));
    }

    private void apply(Brand b, BrandRequest req, String name) {
        b.setName(name);
        b.setLogoUrl(req.logoUrl());
        b.setDescription(req.description());
    }
}
