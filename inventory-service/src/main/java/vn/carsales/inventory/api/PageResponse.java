package vn.carsales.inventory.api;

import java.util.List;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    /** Chuẩn hóa page/size (size mặc định 20, tối đa 100) và sắp xếp theo id tăng dần. */
    public static Pageable pageable(int page, int size) {
        int p = Math.max(page, 0);
        int s = size < 1 ? 20 : Math.min(size, 100);
        return PageRequest.of(p, s, Sort.by("id"));
    }
}
