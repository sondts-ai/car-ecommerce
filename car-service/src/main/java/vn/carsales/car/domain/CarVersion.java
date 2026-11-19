package vn.carsales.car.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;

@Entity
@Table(name = "car_versions")
public class CarVersion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "model_id", nullable = false)
    private CarModel model;
    @Column(name = "version_name", nullable = false, length = 150)
    private String versionName;
    @Column(length = 100)
    private String engine;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Transmission transmission;
    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 20)
    private FuelType fuelType;
    @JdbcTypeCode(SqlTypes.TINYINT)
    private Integer seats;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public CarModel getModel() { return model; }
    public void setModel(CarModel model) { this.model = model; }
    public String getVersionName() { return versionName; }
    public void setVersionName(String versionName) { this.versionName = versionName; }
    public String getEngine() { return engine; }
    public void setEngine(String engine) { this.engine = engine; }
    public Transmission getTransmission() { return transmission; }
    public void setTransmission(Transmission transmission) { this.transmission = transmission; }
    public FuelType getFuelType() { return fuelType; }
    public void setFuelType(FuelType fuelType) { this.fuelType = fuelType; }
    public Integer getSeats() { return seats; }
    public void setSeats(Integer seats) { this.seats = seats; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
