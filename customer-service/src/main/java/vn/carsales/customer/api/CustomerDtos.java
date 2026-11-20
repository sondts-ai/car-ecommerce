package vn.carsales.customer.api;

import jakarta.validation.constraints.*;
import vn.carsales.customer.domain.Gender;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class CustomerDtos {
    private CustomerDtos(){}
    public record ProfileInput(@NotBlank @Size(min=2,max=150) String fullName,
          @Past LocalDate birthday,@NotNull Gender gender){}
    public record AccountInfo(Long userId,String email,String phone,String role,String status){}
    public record ProfileView(Long customerId,Long userId,String fullName,LocalDate birthday,Gender gender,
          LocalDateTime createdAt,LocalDateTime updatedAt,AccountInfo account){}
    public record AddressInput(@NotBlank @Size(max=150) String receiverName,
          @NotBlank @Pattern(regexp="^\\+?[0-9]{9,20}$") String phone,
          @NotBlank @Size(max=500) String address,boolean isDefault){}
    public record AddressView(Long id,String receiverName,String phone,String address,boolean isDefault,
          LocalDateTime createdAt,LocalDateTime updatedAt){}
}
