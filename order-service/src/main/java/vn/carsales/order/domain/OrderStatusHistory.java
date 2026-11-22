package vn.carsales.order.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="order_status_history")
public class OrderStatusHistory {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="order_id",nullable=false,columnDefinition="BIGINT UNSIGNED")
    private Long orderId;
    @Enumerated(EnumType.STRING) @Column(name="old_status",length=32)
    private OrderStatus oldStatus;
    @Enumerated(EnumType.STRING) @Column(name="new_status",nullable=false,length=32)
    private OrderStatus newStatus;
    @Column(length=500)
    private String note;
    @Column(name="changed_by",columnDefinition="BIGINT UNSIGNED")
    private Long changedBy;
    @Column(name="created_at",nullable=false,insertable=false,updatable=false)
    private LocalDateTime createdAt;
    public Long getId(){return id;} public Long getOrderId(){return orderId;} public OrderStatus getOldStatus(){return oldStatus;}
    public OrderStatus getNewStatus(){return newStatus;} public String getNote(){return note;} public Long getChangedBy(){return changedBy;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setOrderId(Long value){orderId=value;} public void setOldStatus(OrderStatus value){oldStatus=value;}
    public void setNewStatus(OrderStatus value){newStatus=value;} public void setNote(String value){note=value;}
    public void setChangedBy(Long value){changedBy=value;}
}
