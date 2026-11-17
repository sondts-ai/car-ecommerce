package vn.carsales.customer.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.CustomerDtos.AddressInput;
import vn.carsales.customer.domain.Customer;
import vn.carsales.customer.domain.CustomerAddress;
import vn.carsales.customer.repository.CustomerAddressRepository;
import vn.carsales.customer.repository.CustomerRepository;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AddressServiceTest {
    @Mock CustomerRepository customers;
    @Mock CustomerAddressRepository addresses;
    @InjectMocks AddressService service;

    @Test void cannotUpdateAddressOwnedByAnotherCustomer(){
        Customer owner=new Customer();owner.setUserId(99L);
        when(customers.findByUserId(99L)).thenReturn(Optional.of(owner));
        when(addresses.findByIdAndCustomerId(7L,owner.getId())).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class,()->service.update(99L,7L,new AddressInput("Buyer","0912345678","Some address",false)));
    }

    @Test void settingDefaultClearsExistingDefaultBeforeSavingNewOne(){
        Customer customer=org.mockito.Mockito.mock(Customer.class);when(customer.getId()).thenReturn(4L);
        CustomerAddress address=new CustomerAddress();
        when(customers.findByUserId(2L)).thenReturn(Optional.of(customer));
        when(addresses.findByIdAndCustomerId(12L,4L)).thenReturn(Optional.of(address));
        when(addresses.saveAndFlush(address)).thenReturn(address);
        var result=service.setDefault(2L,12L);
        verify(addresses).clearDefault(4L);assertTrue(result.isDefault());
    }
}
