package vn.carsales.inventory.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import vn.carsales.inventory.domain.Enums.VehicleCondition;
import vn.carsales.inventory.domain.Enums.VehicleStatus;

@Entity
@Table(name = "vehicles")
public class Vehicle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    /** Tham chiếu logic car_db.car_versions.id (không có FK). */
    @Column(name = "version_id", nullable = false)
    private Long versionId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;
    @Column(nullable = false, length = 17)
    private String vin;
    @Column(name = "license_plate", length = 20)
    private String licensePlate;
    @Enumerated(EnumType.STRING)
    @Column(name = "`condition`", nullable = false, length = 10)
    private VehicleCondition condition;
    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "`year`", nullable = false)
    private Integer year;
    @Column(length = 50)
    private String color;
    @Column(nullable = false)
    private Integer mileage = 0;
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleStatus status = VehicleStatus.AVAILABLE;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getVersionId() { return versionId; }
    public void setVersionId(Long versionId) { this.versionId = versionId; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getVin() { return vin; }
    public void setVin(String vin) { this.vin = vin; }
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    public VehicleCondition getCondition() { return condition; }
    public void setCondition(VehicleCondition condition) { this.condition = condition; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Integer getMileage() { return mileage; }
    public void setMileage(Integer mileage) { this.mileage = mileage; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public VehicleStatus getStatus() { return status; }
    public void setStatus(VehicleStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
