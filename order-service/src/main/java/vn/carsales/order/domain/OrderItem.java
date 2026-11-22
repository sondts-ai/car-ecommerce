package vn.carsales.order.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity @Table(name="order_items")
public class OrderItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="order_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long orderId;
    @Column(name="vehicle_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long vehicleId;
    @Column(name="vehicle_name",nullable=false,length=255)
    private String vehicleName;
    @Column(length=17,nullable=false)
    private String vin;
    @Column(nullable=false,precision=15,scale=2)
    private BigDecimal price;
    public Long getId(){return id;} public Long getOrderId(){return orderId;} public Long getVehicleId(){return vehicleId;}
    public String getVehicleName(){return vehicleName;} public String getVin(){return vin;} public BigDecimal getPrice(){return price;}
    public void setOrderId(Long value){orderId=value;} public void setVehicleId(Long value){vehicleId=value;}
    public void setVehicleName(String value){vehicleName=value;} public void setVin(String value){vin=value;}
    public void setPrice(BigDecimal value){price=value;}
}
