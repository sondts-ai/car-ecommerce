package vn.carsales.customer.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.CustomerDtos.*;
import vn.carsales.customer.domain.Customer;
import vn.carsales.customer.domain.CustomerAddress;
import vn.carsales.customer.repository.CustomerAddressRepository;
import vn.carsales.customer.repository.CustomerRepository;
import java.util.List;

@Service
public class AddressService {
    private final CustomerRepository customers;private final CustomerAddressRepository addresses;
    public AddressService(CustomerRepository customers,CustomerAddressRepository addresses){this.customers=customers;this.addresses=addresses;}
    @Transactional(readOnly=true)
    public List<AddressView> list(Long userId){Customer c=requireCustomer(userId);return addresses.findAllByCustomerIdOrderByIdDesc(c.getId()).stream().map(this::view).toList();}
    @Transactional(readOnly=true)
    public AddressView getDefault(Long userId){Customer c=requireCustomer(userId);return addresses.findFirstByCustomerIdAndIsDefaultTrue(c.getId()).map(this::view).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Default address not found"));}
    @Transactional
    public AddressView create(Long userId,AddressInput input){
        Customer customer=requireCustomer(userId);
        if(input.isDefault()){
            addresses.clearDefault(customer.getId());customer=requireCustomer(userId);
        }
        CustomerAddress address=new CustomerAddress();address.setCustomer(customer);apply(address,input);
        return view(addresses.saveAndFlush(address));
    }
    @Transactional
    public AddressView update(Long userId,Long addressId,AddressInput input){
        Customer customer=requireCustomer(userId);CustomerAddress address=requireOwned(addressId,customer.getId());
        if(input.isDefault()){
            addresses.clearDefault(customer.getId());address=requireOwned(addressId,customer.getId());
        }
        apply(address,input);return view(addresses.saveAndFlush(address));
    }
    @Transactional
    public void delete(Long userId,Long addressId){Customer c=requireCustomer(userId);addresses.delete(requireOwned(addressId,c.getId()));}
    @Transactional
    public AddressView setDefault(Long userId,Long addressId){
        Customer c=requireCustomer(userId);addresses.clearDefault(c.getId());
        CustomerAddress address=requireOwned(addressId,c.getId());address.setDefault(true);return view(addresses.saveAndFlush(address));
    }
    private Customer requireCustomer(Long userId){return customers.findByUserId(userId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Customer profile not found"));}
    private CustomerAddress requireOwned(Long addressId,Long customerId){return addresses.findByIdAndCustomerId(addressId,customerId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Address not found"));}
    private void apply(CustomerAddress a,AddressInput in){a.setReceiverName(in.receiverName().trim());a.setPhone(in.phone().trim());a.setAddress(in.address().trim());a.setDefault(in.isDefault());}
    private AddressView view(CustomerAddress a){return new AddressView(a.getId(),a.getReceiverName(),a.getPhone(),a.getAddress(),a.isDefault(),a.getCreatedAt(),a.getUpdatedAt());}
}
