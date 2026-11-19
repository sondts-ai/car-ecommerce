package vn.carsales.inventory.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import vn.carsales.inventory.domain.Enums.VehicleStatus;

/** Bảng inventory_history (bảng cũ không có cột changed_by). */
@Entity
@Table(name = "inventory_history")
public class VehicleStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 20)
    private VehicleStatus oldStatus;
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private VehicleStatus newStatus;
    @Column(length = 500)
    private String reason;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public static VehicleStatusHistory of(Long vehicleId, VehicleStatus oldStatus, VehicleStatus newStatus,
                                          String reason) {
        VehicleStatusHistory h = new VehicleStatusHistory();
        h.vehicleId = vehicleId;
        h.oldStatus = oldStatus;
        h.newStatus = newStatus;
        h.reason = reason;
        return h;
    }

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public VehicleStatus getOldStatus() { return oldStatus; }
    public VehicleStatus getNewStatus() { return newStatus; }
    public String getReason() { return reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
