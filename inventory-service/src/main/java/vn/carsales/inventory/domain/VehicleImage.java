package vn.carsales.inventory.domain;

import java.time.LocalDateTime;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicle_images")
public class VehicleImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;
    @Column(name = "is_thumbnail", nullable = false)
    private boolean thumbnail;
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public boolean isThumbnail() { return thumbnail; }
    public void setThumbnail(boolean thumbnail) { this.thumbnail = thumbnail; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
