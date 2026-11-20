package vn.carsales.order.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="cart_items")
public class CartItem {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="cart_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long cartId;
    @Column(name="vehicle_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long vehicleId;
    @Column(name="added_at",nullable=false,insertable=false,updatable=false)
    private LocalDateTime addedAt;
    public Long getId(){return id;} public Long getCartId(){return cartId;} public void setCartId(Long v){cartId=v;}
    public Long getVehicleId(){return vehicleId;} public void setVehicleId(Long v){vehicleId=v;}
    public LocalDateTime getAddedAt(){return addedAt;}
}
