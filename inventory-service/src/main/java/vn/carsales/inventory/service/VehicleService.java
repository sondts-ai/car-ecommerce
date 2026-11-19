package vn.carsales.inventory.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import vn.carsales.inventory.api.InventoryDtos.BranchChangeRequest;
import vn.carsales.inventory.api.InventoryDtos.BranchCount;
import vn.carsales.inventory.api.InventoryDtos.BranchResponse;
import vn.carsales.inventory.api.InventoryDtos.DocumentRequest;
import vn.carsales.inventory.api.InventoryDtos.DocumentResponse;
import vn.carsales.inventory.api.InventoryDtos.HistoryResponse;
import vn.carsales.inventory.api.InventoryDtos.ImageRequest;
import vn.carsales.inventory.api.InventoryDtos.ImageResponse;
import vn.carsales.inventory.api.InventoryDtos.InternalVehicle;
import vn.carsales.inventory.api.InventoryDtos.StatusRequest;
import vn.carsales.inventory.api.InventoryDtos.VehicleCreateRequest;
import vn.carsales.inventory.api.InventoryDtos.VehicleDetail;
import vn.carsales.inventory.api.InventoryDtos.VehicleStats;
import vn.carsales.inventory.api.InventoryDtos.VehicleSummary;
import vn.carsales.inventory.api.InventoryDtos.VehicleUpdateRequest;
import vn.carsales.inventory.api.PageResponse;
import vn.carsales.inventory.domain.Branch;
import vn.carsales.inventory.domain.Enums.VehicleCondition;
import vn.carsales.inventory.domain.Enums.VehicleStatus;
import vn.carsales.inventory.domain.Inventory;
import vn.carsales.inventory.domain.Vehicle;
import vn.carsales.inventory.domain.VehicleDocument;
import vn.carsales.inventory.domain.VehicleImage;
import vn.carsales.inventory.domain.VehicleStatusHistory;
import vn.carsales.inventory.repository.BranchRepository;
import vn.carsales.inventory.repository.InventoryRepository;
import vn.carsales.inventory.repository.VehicleDocumentRepository;
import vn.carsales.inventory.repository.VehicleImageRepository;
import vn.carsales.inventory.repository.VehicleRepository;
import vn.carsales.inventory.repository.VehicleStatusHistoryRepository;

/**
 * Nghiệp vụ từng chiếc xe. Chi nhánh của xe nằm ở bảng inventory (1 xe = 1 dòng).
 * Các lời gọi sang car-service (HTTP) nằm NGOÀI transaction DB; phần ghi DB dùng TransactionTemplate.
 */
@Service
public class VehicleService {

    private final VehicleRepository vehicles;
    private final BranchRepository branches;
    private final InventoryRepository inventory;
    private final VehicleImageRepository images;
    private final VehicleDocumentRepository documents;
    private final VehicleStatusHistoryRepository history;
    private final CarServiceClient cars;
    private final TransactionTemplate tx;
    private final TransactionTemplate txRead;

    public VehicleService(VehicleRepository vehicles, BranchRepository branches, InventoryRepository inventory,
                          VehicleImageRepository images, VehicleDocumentRepository documents,
                          VehicleStatusHistoryRepository history, CarServiceClient cars,
                          PlatformTransactionManager txManager) {
        this.vehicles = vehicles;
        this.branches = branches;
        this.inventory = inventory;
        this.images = images;
        this.documents = documents;
        this.history = history;
        this.cars = cars;
        this.tx = new TransactionTemplate(txManager);
        this.txRead = new TransactionTemplate(txManager);
        this.txRead.setReadOnly(true);
    }

    // ------------------------------------------------------------------- query

    public PageResponse<VehicleSummary> list(VehicleStatus status, Long branchId, Long versionId,
                                             VehicleCondition condition, BigDecimal minPrice, BigDecimal maxPrice,
                                             String q, int page, int size) {
        Specification<Vehicle> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null) ps.add(cb.equal(root.get("status"), status));
            if (versionId != null) ps.add(cb.equal(root.get("versionId"), versionId));
            if (condition != null) ps.add(cb.equal(root.get("condition"), condition));
            if (minPrice != null) ps.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            if (maxPrice != null) ps.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            if (branchId != null) {
                Subquery<Long> sq = query.subquery(Long.class);
                Root<Inventory> inv = sq.from(Inventory.class);
                sq.select(inv.get("id")).where(cb.equal(inv.get("vehicleId"), root.get("id")),
                        cb.equal(inv.get("branch").get("id"), branchId));
                ps.add(cb.exists(sq));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                ps.add(cb.or(cb.like(cb.lower(root.get("vin")), like),
                        cb.like(cb.lower(cb.coalesce(root.<String>get("licensePlate"), "")), like)));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        PageResponse<VehicleSummary> result = txRead.execute(s -> {
            Page<Vehicle> p = vehicles.findAll(spec, PageResponse.pageable(page, size));
            List<Long> ids = p.getContent().stream().map(Vehicle::getId).toList();
            Map<Long, String> thumbs = thumbnails(ids);
            Map<Long, Inventory> inv = ids.isEmpty() ? Map.of() : inventory.findByVehicleIds(ids).stream()
                    .collect(Collectors.toMap(Inventory::getVehicleId, Function.identity(), (a, b) -> a));
            return PageResponse.of(p, v -> summary(v, null, thumbs.get(v.getId()), inv.get(v.getId())));
        });
        // cache đơn giản theo versionId trong phạm vi request
        Map<Long, String> names = new HashMap<>();
        List<VehicleSummary> named = result.items().stream()
                .map(v -> withName(v, names.computeIfAbsent(v.versionId(), this::lookupName)))
                .toList();
        return new PageResponse<>(named, result.page(), result.size(), result.totalItems(), result.totalPages());
    }

    public VehicleDetail get(Long id) {
        String name = lookupName(versionIdOf(id));
        return txRead.execute(s -> detail(find(id), name));
    }

    public InternalVehicle internal(Long id) {
        String name = lookupName(versionIdOf(id));
        return txRead.execute(s -> {
            Vehicle v = find(id);
            String thumb = thumbnails(List.of(id)).get(id);
            Branch b = inventory.findByVehicleId(id).map(Inventory::getBranch).orElse(null);
            return new InternalVehicle(v.getId(), v.getVin(), name, v.getVersionId(), v.getCondition(), v.getYear(),
                    v.getColor(), v.getMileage(), v.getPrice(), v.getStatus(), b == null ? null : b.getName(), thumb);
        });
    }

    public List<HistoryResponse> history(Long id) {
        return txRead.execute(s -> {
            find(id);
            return history.findByVehicleIdOrderByCreatedAtDescIdDesc(id).stream().map(HistoryResponse::of).toList();
        });
    }

    public VehicleStats stats() {
        return txRead.execute(s -> {
            Map<String, Long> byStatus = new LinkedHashMap<>();
            for (VehicleStatus st : VehicleStatus.values()) byStatus.put(st.name(), 0L);
            vehicles.countByStatus().forEach(r -> byStatus.put(((VehicleStatus) r[0]).name(), (Long) r[1]));
            Map<String, Long> byCondition = new LinkedHashMap<>();
            for (VehicleCondition c : VehicleCondition.values()) byCondition.put(c.name(), 0L);
            vehicles.countByCondition().forEach(r -> byCondition.put(((VehicleCondition) r[0]).name(), (Long) r[1]));
            List<BranchCount> byBranch = inventory.countByBranch().stream()
                    .map(r -> new BranchCount((Long) r[0], (String) r[1], (Long) r[2])).toList();
            long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
            return new VehicleStats(total, byStatus, byBranch, byCondition);
        });
    }

    // ------------------------------------------------------------------- write

    public VehicleDetail create(VehicleCreateRequest req) {
        Integer mileage = req.mileage() == null ? 0 : req.mileage();
        checkNewMileage(req.condition(), mileage);
        String name = cars.findVersion(req.versionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phiên bản xe không tồn tại"))
                .fullName();
        return tx.execute(s -> {
            Branch branch = branches.findById(req.branchId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không tồn tại"));
            String vin = normalizeVin(req.vin());
            String plate = normalizePlate(req.licensePlate());
            if (vehicles.existsByVinIgnoreCase(vin)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "VIN đã tồn tại");
            }
            if (plate != null && vehicles.existsByLicensePlateIgnoreCase(plate)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Biển số đã tồn tại");
            }
            Vehicle v = new Vehicle();
            v.setVersionId(req.versionId());
            v.setVin(vin);
            v.setLicensePlate(plate);
            v.setCondition(req.condition());
            v.setYear(req.year());
            v.setColor(req.color());
            v.setMileage(mileage);
            v.setPrice(req.price());
            v.setDescription(req.description());
            v.setStatus(VehicleStatus.AVAILABLE);
            v = vehicles.saveAndFlush(v);
            Inventory inv = new Inventory();
            inv.setVehicleId(v.getId());
            inv.setBranch(branch);
            inventory.saveAndFlush(inv);
            history.save(VehicleStatusHistory.of(v.getId(), null, VehicleStatus.AVAILABLE, "Nhập xe"));
            return detail(v, name);
        });
    }

    public VehicleDetail update(Long id, VehicleUpdateRequest req) {
        Integer mileage = req.mileage() == null ? 0 : req.mileage();
        checkNewMileage(req.condition(), mileage);
        Long currentVersionId = versionIdOf(id);
        String name;
        if (Objects.equals(currentVersionId, req.versionId())) {
            name = lookupName(currentVersionId);
        } else {
            name = cars.findVersion(req.versionId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phiên bản xe không tồn tại"))
                    .fullName();
        }
        return tx.execute(s -> {
            Vehicle v = vehicles.findByIdForUpdate(id).orElseThrow(this::notFound);
            if (v.getStatus() == VehicleStatus.SOLD && v.getPrice().compareTo(req.price()) != 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã bán, không thể sửa giá");
            }
            String vin = normalizeVin(req.vin());
            String plate = normalizePlate(req.licensePlate());
            if (vehicles.existsByVinIgnoreCaseAndIdNot(vin, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "VIN đã tồn tại");
            }
            if (plate != null && vehicles.existsByLicensePlateIgnoreCaseAndIdNot(plate, id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Biển số đã tồn tại");
            }
            v.setVersionId(req.versionId());
            v.setVin(vin);
            v.setLicensePlate(plate);
            v.setCondition(req.condition());
            v.setYear(req.year());
            v.setColor(req.color());
            v.setMileage(mileage);
            v.setPrice(req.price());
            v.setDescription(req.description());
            v = vehicles.saveAndFlush(v);
            return detail(v, name);
        });
    }

    public void delete(Long id) {
        tx.executeWithoutResult(s -> {
            Vehicle v = vehicles.findByIdForUpdate(id).orElseThrow(this::notFound);
            if (v.getStatus() == VehicleStatus.RESERVED || v.getStatus() == VehicleStatus.SOLD) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa xe đang được giữ hoặc đã bán");
            }
            images.deleteAll(images.findByVehicleIdOrderBySortOrderAscIdAsc(id));
            documents.deleteAll(documents.findByVehicleIdOrderByIdAsc(id));
            history.deleteAll(history.findByVehicleIdOrderByCreatedAtDescIdDesc(id));
            inventory.findByVehicleId(id).ifPresent(inventory::delete);
            vehicles.delete(v);
            vehicles.flush();
        });
    }

    public HistoryResponse changeStatus(Long id, StatusRequest req) {
        return tx.execute(s -> {
            Vehicle v = vehicles.findByIdForUpdate(id).orElseThrow(this::notFound);
            if (v.getStatus() == VehicleStatus.SOLD) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Xe đã bán, không thể đổi trạng thái");
            }
            if (v.getStatus() == req.status()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe đang ở trạng thái này rồi");
            }
            VehicleStatus old = v.getStatus();
            v.setStatus(req.status());
            vehicles.saveAndFlush(v);
            return HistoryResponse.of(history.saveAndFlush(
                    VehicleStatusHistory.of(id, old, req.status(), req.reason())));
        });
    }

    /** Chuyển chi nhánh (cập nhật bảng inventory); lý do ghi vào inventory_history, trạng thái xe giữ nguyên. */
    public HistoryResponse changeBranch(Long id, BranchChangeRequest req) {
        return tx.execute(s -> {
            Vehicle v = vehicles.findByIdForUpdate(id).orElseThrow(this::notFound);
            Branch target = branches.findById(req.branchId()).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi nhánh không tồn tại"));
            Inventory inv = inventory.findByVehicleId(id).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.CONFLICT, "Xe chưa được gán chi nhánh trong kho"));
            Branch from = inv.getBranch();
            if (from.getId().equals(target.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe đang ở chi nhánh này rồi");
            }
            inv.setBranch(target);
            inventory.saveAndFlush(inv);
            String reason = "Chuyển chi nhánh từ " + from.getName() + " sang " + target.getName()
                    + (req.reason() == null || req.reason().isBlank() ? "" : ": " + req.reason().trim());
            return HistoryResponse.of(history.saveAndFlush(
                    VehicleStatusHistory.of(id, v.getStatus(), v.getStatus(), reason)));
        });
    }

    // ------------------------------------------------------------------ images

    public ImageResponse addImage(Long vehicleId, ImageRequest req) {
        return tx.execute(s -> {
            find(vehicleId);
            boolean thumb = Boolean.TRUE.equals(req.isThumbnail());
            if (thumb) {
                images.clearThumbnail(vehicleId);
            }
            VehicleImage img = new VehicleImage();
            img.setVehicleId(vehicleId);
            img.setImageUrl(req.imageUrl().trim());
            img.setThumbnail(thumb);
            img.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
            return ImageResponse.of(images.saveAndFlush(img));
        });
    }

    public ImageResponse setThumbnail(Long imageId) {
        return tx.execute(s -> {
            VehicleImage img = findImage(imageId);
            images.clearThumbnail(img.getVehicleId());
            img = findImage(imageId); // persistence context đã bị clear
            img.setThumbnail(true);
            return ImageResponse.of(images.saveAndFlush(img));
        });
    }

    public void deleteImage(Long imageId) {
        tx.executeWithoutResult(s -> {
            images.delete(findImage(imageId));
            images.flush();
        });
    }

    public DocumentResponse addDocument(Long vehicleId, DocumentRequest req) {
        return tx.execute(s -> {
            find(vehicleId);
            VehicleDocument d = new VehicleDocument();
            d.setVehicleId(vehicleId);
            d.setDocumentType(req.documentType());
            d.setFileUrl(req.fileUrl().trim());
            return DocumentResponse.of(documents.saveAndFlush(d));
        });
    }

    public void deleteDocument(Long documentId) {
        tx.executeWithoutResult(s -> {
            VehicleDocument d = documents.findById(documentId).orElseThrow(
                    () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy giấy tờ"));
            documents.delete(d);
            documents.flush();
        });
    }

    // ----------------------------------------------------------------- helpers

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy xe");
    }

    private Vehicle find(Long id) {
        return vehicles.findById(id).orElseThrow(this::notFound);
    }

    private VehicleImage findImage(Long id) {
        return images.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy ảnh"));
    }

    private Long versionIdOf(Long vehicleId) {
        return txRead.execute(s -> find(vehicleId).getVersionId());
    }

    /** Tên đầy đủ "Hãng Dòng Phiên bản"; null nếu car-service báo phiên bản không còn tồn tại. */
    private String lookupName(Long versionId) {
        return cars.findVersion(versionId).map(CarServiceClient.VersionInfo::fullName).orElse(null);
    }

    private static void checkNewMileage(VehicleCondition condition, Integer mileage) {
        if (condition == VehicleCondition.NEW && mileage != null && mileage != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Xe mới (NEW) phải có số km = 0");
        }
    }

    private static String normalizeVin(String vin) {
        return vin.trim().toUpperCase();
    }

    private static String normalizePlate(String plate) {
        return plate == null || plate.isBlank() ? null : plate.trim();
    }

    private Map<Long, String> thumbnails(List<Long> vehicleIds) {
        if (vehicleIds.isEmpty()) {
            return Map.of();
        }
        return images.findThumbnails(vehicleIds).stream()
                .collect(Collectors.toMap(VehicleImage::getVehicleId, VehicleImage::getImageUrl, (a, b) -> a));
    }

    private VehicleSummary summary(Vehicle v, String name, String thumbnailUrl, Inventory inv) {
        Branch b = inv == null ? null : inv.getBranch();
        return new VehicleSummary(v.getId(), v.getVin(), v.getLicensePlate(), name, v.getVersionId(),
                b == null ? null : b.getId(), b == null ? null : b.getName(), v.getCondition(), v.getYear(),
                v.getColor(), v.getMileage(), v.getPrice(), v.getStatus(), thumbnailUrl);
    }

    private VehicleSummary withName(VehicleSummary s, String name) {
        return new VehicleSummary(s.id(), s.vin(), s.licensePlate(), name, s.versionId(), s.branchId(),
                s.branchName(), s.condition(), s.year(), s.color(), s.mileage(), s.price(), s.status(),
                s.thumbnailUrl());
    }

    private VehicleDetail detail(Vehicle v, String name) {
        List<ImageResponse> imgs = images.findByVehicleIdOrderBySortOrderAscIdAsc(v.getId()).stream()
                .map(ImageResponse::of).toList();
        List<DocumentResponse> docs = documents.findByVehicleIdOrderByIdAsc(v.getId()).stream()
                .map(DocumentResponse::of).toList();
        BranchResponse branch = inventory.findByVehicleId(v.getId()).map(i -> BranchResponse.of(i.getBranch()))
                .orElse(null);
        return new VehicleDetail(v.getId(), v.getVin(), v.getLicensePlate(), name, v.getVersionId(), branch,
                v.getCondition(), v.getYear(), v.getColor(), v.getMileage(), v.getPrice(), v.getDescription(),
                v.getStatus(), v.getCreatedAt(), v.getUpdatedAt(), imgs, docs);
    }
}
