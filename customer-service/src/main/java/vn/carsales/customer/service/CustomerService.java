package vn.carsales.customer.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.CustomerDtos.*;
import vn.carsales.customer.domain.*;
import vn.carsales.customer.repository.*;

@Service
public class CustomerService {
    private final CustomerRepository customers; private final AuthIdentityClient auth;
    public CustomerService(CustomerRepository customers,AuthIdentityClient auth){this.customers=customers;this.auth=auth;}

    @Transactional(readOnly=true)
    public ProfileView getProfile(Long userId,String token){
        Customer customer=requireCustomer(userId);var identity=auth.currentUser(token);
        if(!userId.equals(identity.id())||!"CUSTOMER".equals(identity.role())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Auth identity does not match the customer token");
        return profile(customer,identity);
    }
    @Transactional
    public ProfileView createProfile(Long userId,String token,ProfileInput input){
        if(customers.existsByUserId(userId)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Customer profile already exists");
        var identity=auth.currentUser(token);
        if(!userId.equals(identity.id())||!"CUSTOMER".equals(identity.role())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Auth identity does not match the customer token");
        Customer c=new Customer();c.setUserId(userId);apply(c,input);
        try{return profile(customers.saveAndFlush(c),identity);}
        catch(DataIntegrityViolationException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"Customer profile already exists");}
    }
    @Transactional
    public ProfileView updateProfile(Long userId,ProfileInput input){
        Customer customer=requireCustomer(userId);apply(customer,input);return profile(customer,null);
    }
    private Customer requireCustomer(Long userId){return customers.findByUserId(userId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Customer profile not found"));}
    private void apply(Customer c,ProfileInput in){c.setFullName(in.fullName().trim());c.setBirthday(in.birthday());c.setGender(in.gender());}
    private ProfileView profile(Customer c,AuthIdentityClient.AuthUser identity){
        AccountInfo account=identity==null?null:new AccountInfo(identity.id(),identity.email(),identity.phone(),identity.role(),identity.status());
        return new ProfileView(c.getId(),c.getUserId(),c.getFullName(),c.getBirthday(),c.getGender(),c.getCreatedAt(),c.getUpdatedAt(),account);
    }
}
