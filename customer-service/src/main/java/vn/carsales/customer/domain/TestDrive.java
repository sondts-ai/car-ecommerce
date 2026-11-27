package vn.carsales.customer.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "test_drives")
public class TestDrive {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @Column(name = "user_id", columnDefinition = "BIGINT UNSIGNED")
    private Long userId;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(name = "car_slug", nullable = false, length = 100)
    private String carSlug;

    @Column(name = "car_name", nullable = false, length = 150)
    private String carName;

    @Column(name = "showroom_id", nullable = false, length = 20)
    private String showroomId;

    @Column(name = "drive_date", nullable = false)
    private LocalDate driveDate;

    @Column(name = "drive_time", nullable = false)
    private LocalTime driveTime;

    @Column(length = 1000)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TestDriveStatus status;

    @Column(name = "customer_full_name", nullable = false, length = 150)
    private String customerFullName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_email", length = 254)
    private String customerEmail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "active_slot_key", length = 150, insertable = false, updatable = false)
    private String activeSlotKey;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getCarSlug() { return carSlug; }
    public void setCarSlug(String carSlug) { this.carSlug = carSlug; }
    public String getCarName() { return carName; }
    public void setCarName(String carName) { this.carName = carName; }
    public String getShowroomId() { return showroomId; }
    public void setShowroomId(String showroomId) { this.showroomId = showroomId; }
    public LocalDate getDriveDate() { return driveDate; }
    public void setDriveDate(LocalDate driveDate) { this.driveDate = driveDate; }
    public LocalTime getDriveTime() { return driveTime; }
    public void setDriveTime(LocalTime driveTime) { this.driveTime = driveTime; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public TestDriveStatus getStatus() { return status; }
    public void setStatus(TestDriveStatus status) { this.status = status; }
    public String getCustomerFullName() { return customerFullName; }
    public void setCustomerFullName(String customerFullName) { this.customerFullName = customerFullName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
