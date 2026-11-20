package vn.carsales.customer.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name="customer_addresses")
public class CustomerAddress {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="customer_id", nullable=false)
    private Customer customer;
    @Column(name="receiver_name", nullable=false, length=150)
    private String receiverName;
    @Column(nullable=false, length=20)
    private String phone;
    @Column(nullable=false, length=500)
    private String address;
    @Column(name="is_default", nullable=false)
    private boolean isDefault;
    @CreationTimestamp @Column(name="created_at", nullable=false, updatable=false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at", nullable=false)
    private LocalDateTime updatedAt;

    public Long getId(){return id;} public Customer getCustomer(){return customer;} public void setCustomer(Customer v){customer=v;}
    public String getReceiverName(){return receiverName;} public void setReceiverName(String v){receiverName=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getAddress(){return address;} public void setAddress(String v){address=v;}
    public boolean isDefault(){return isDefault;} public void setDefault(boolean v){isDefault=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
