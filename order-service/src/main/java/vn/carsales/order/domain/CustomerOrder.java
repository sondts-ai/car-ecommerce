package vn.carsales.order.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name="orders")
public class CustomerOrder {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="order_code",nullable=false,length=30,unique=true)
    private String orderCode;
    @Column(name="customer_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long customerId;
    @Column(nullable=false,precision=15,scale=2)
    private BigDecimal subtotal;
    @Column(name="total_amount",nullable=false,precision=15,scale=2)
    private BigDecimal totalAmount;
    @Column(name="deposit_amount",nullable=false,precision=15,scale=2)
    private BigDecimal depositAmount;
    @Column(name="remaining_amount",nullable=false,precision=15,scale=2)
    private BigDecimal remainingAmount;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=32)
    private OrderStatus status;
    @Column(name="reserved_until")
    private LocalDateTime reservedUntil;
    @Column(length=500)
    private String note;
    @CreationTimestamp @Column(name="created_at",nullable=false,updatable=false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at",nullable=false)
    private LocalDateTime updatedAt;
    public Long getId(){return id;} public String getOrderCode(){return orderCode;} public Long getCustomerId(){return customerId;}
    public BigDecimal getSubtotal(){return subtotal;} public BigDecimal getTotalAmount(){return totalAmount;} public BigDecimal getDepositAmount(){return depositAmount;}
    public BigDecimal getRemainingAmount(){return remainingAmount;} public OrderStatus getStatus(){return status;} public LocalDateTime getReservedUntil(){return reservedUntil;}
    public String getNote(){return note;} public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setOrderCode(String value){orderCode=value;} public void setCustomerId(Long value){customerId=value;}
    public void setSubtotal(BigDecimal value){subtotal=value;} public void setTotalAmount(BigDecimal value){totalAmount=value;}
    public void setDepositAmount(BigDecimal value){depositAmount=value;} public void setRemainingAmount(BigDecimal value){remainingAmount=value;}
    public void setStatus(OrderStatus value){status=value;} public void setReservedUntil(LocalDateTime value){reservedUntil=value;}
    public void setNote(String value){note=value;}
}
