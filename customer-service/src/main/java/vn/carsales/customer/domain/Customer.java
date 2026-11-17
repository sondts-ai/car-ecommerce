package vn.carsales.customer.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="customers")
public class Customer {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(columnDefinition="BIGINT UNSIGNED")
    private Long id;
    @Column(name="user_id", nullable=false, unique=true, columnDefinition="BIGINT UNSIGNED")
    private Long userId;
    @Column(name="full_name", nullable=false, length=150)
    private String fullName;
    private LocalDate birthday;
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=6)
    private Gender gender=Gender.OTHER;
    @CreationTimestamp @Column(name="created_at", nullable=false, updatable=false)
    private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at", nullable=false)
    private LocalDateTime updatedAt;

    public Long getId(){return id;} public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
    public String getFullName(){return fullName;} public void setFullName(String v){fullName=v;}
    public LocalDate getBirthday(){return birthday;} public void setBirthday(LocalDate v){birthday=v;}
    public Gender getGender(){return gender;} public void setGender(Gender v){gender=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
