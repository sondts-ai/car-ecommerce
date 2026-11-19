package vn.carsales.inventory.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import vn.carsales.inventory.api.InventoryDtos.BranchRequest;
import vn.carsales.inventory.api.InventoryDtos.BranchResponse;
import vn.carsales.inventory.api.PageResponse;
import vn.carsales.inventory.domain.Branch;
import vn.carsales.inventory.repository.BranchRepository;
import vn.carsales.inventory.repository.InventoryRepository;

@Service
public class BranchService {

    private final BranchRepository branches;
    private final InventoryRepository inventory;

    public BranchService(BranchRepository branches, InventoryRepository inventory) {
        this.branches = branches;
        this.inventory = inventory;
    }

    @Transactional(readOnly = true)
    public PageResponse<BranchResponse> list(String q, int page, int size) {
        return PageResponse.of(branches.search(q == null ? "" : q.trim(), PageResponse.pageable(page, size)),
                BranchResponse::of);
    }

    @Transactional(readOnly = true)
    public BranchResponse get(Long id) {
        return BranchResponse.of(find(id));
    }

    @Transactional
    public BranchResponse create(BranchRequest req) {
        String name = req.name().trim();
        if (branches.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên chi nhánh đã tồn tại");
        }
        Branch b = new Branch();
        apply(b, req, name);
        return BranchResponse.of(branches.saveAndFlush(b));
    }

    @Transactional
    public BranchResponse update(Long id, BranchRequest req) {
        Branch b = find(id);
        String name = req.name().trim();
        if (branches.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Tên chi nhánh đã tồn tại");
        }
        apply(b, req, name);
        return BranchResponse.of(branches.saveAndFlush(b));
    }

    @Transactional
    public void delete(Long id) {
        Branch b = find(id);
        if (inventory.existsByBranchId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa chi nhánh còn xe");
        }
        branches.delete(b);
        branches.flush();
    }

    private Branch find(Long id) {
        return branches.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy chi nhánh"));
    }

    private void apply(Branch b, BranchRequest req, String name) {
        b.setName(name);
        b.setAddress(req.address().trim());
        b.setPhone(req.phone());
    }
}
