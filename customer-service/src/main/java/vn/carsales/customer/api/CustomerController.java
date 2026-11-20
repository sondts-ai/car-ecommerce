package vn.carsales.customer.api;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.carsales.customer.security.CustomerPrincipal;
import vn.carsales.customer.service.*;

@RestController
@RequestMapping("/api/v1/customers/me")
public class CustomerController {
    private final CustomerService customers;private final AddressService addresses;
    public CustomerController(CustomerService customers,AddressService addresses){this.customers=customers;this.addresses=addresses;}
    @GetMapping
    public ApiResponse<CustomerDtos.ProfileView> getProfile(Authentication auth,@RequestHeader("Authorization")String bearer){
        return ApiResponse.ok("Customer profile",customers.getProfile(principal(auth).userId(),bearer.substring(7).trim()));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CustomerDtos.ProfileView> createProfile(Authentication auth,@RequestHeader("Authorization")String bearer,@Valid @RequestBody CustomerDtos.ProfileInput input){
        return ApiResponse.ok("Customer profile created",customers.createProfile(principal(auth).userId(),bearer.substring(7).trim(),input));
    }
    @PutMapping
    public ApiResponse<CustomerDtos.ProfileView> updateProfile(Authentication auth,@Valid @RequestBody CustomerDtos.ProfileInput input){
        return ApiResponse.ok("Customer profile updated",customers.updateProfile(principal(auth).userId(),input));
    }
    @GetMapping("/addresses")
    public ApiResponse<?> listAddresses(Authentication auth){return ApiResponse.ok("Customer addresses",addresses.list(principal(auth).userId()));}
    @GetMapping("/addresses/default")
    public ApiResponse<CustomerDtos.AddressView> defaultAddress(Authentication auth){return ApiResponse.ok("Default address",addresses.getDefault(principal(auth).userId()));}
    @PostMapping("/addresses") @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CustomerDtos.AddressView> addAddress(Authentication auth,@Valid @RequestBody CustomerDtos.AddressInput input){return ApiResponse.ok("Address created",addresses.create(principal(auth).userId(),input));}
    @PutMapping("/addresses/{addressId}")
    public ApiResponse<CustomerDtos.AddressView> updateAddress(Authentication auth,@PathVariable Long addressId,@Valid @RequestBody CustomerDtos.AddressInput input){return ApiResponse.ok("Address updated",addresses.update(principal(auth).userId(),addressId,input));}
    @DeleteMapping("/addresses/{addressId}")
    public ApiResponse<Void> deleteAddress(Authentication auth,@PathVariable Long addressId){addresses.delete(principal(auth).userId(),addressId);return ApiResponse.ok("Address deleted",null);}
    @PutMapping("/addresses/{addressId}/default")
    public ApiResponse<CustomerDtos.AddressView> setDefault(Authentication auth,@PathVariable Long addressId){return ApiResponse.ok("Default address updated",addresses.setDefault(principal(auth).userId(),addressId));}
    private CustomerPrincipal principal(Authentication auth){return (CustomerPrincipal)auth.getPrincipal();}
}
