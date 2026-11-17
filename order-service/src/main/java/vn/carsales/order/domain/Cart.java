package vn.carsales.order.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name="carts")
public class Cart {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="customer_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long customerId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=12)
    private CartStatus status=CartStatus.ACTIVE;
    @CreationTimestamp @Column(name="created_at",nullable=false,updatable=false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false)
    private LocalDateTime updatedAt;
    public Long getId(){return id;} public Long getCustomerId(){return customerId;} public void setCustomerId(Long v){customerId=v;}
    public CartStatus getStatus(){return status;} public void setStatus(CartStatus v){status=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
