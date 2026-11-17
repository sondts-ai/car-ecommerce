package vn.carsales.order.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.order.repository.*;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderQueryServiceTest{
    @Mock CartRepository carts;@Mock CartItemRepository cartItems;@Mock CustomerOrderRepository orders;
    @Mock OrderItemRepository orderItems;@Mock OrderStatusHistoryRepository history;@Mock CustomerIdentityClient customerIdentity;
    @InjectMocks OrderQueryService service;
    @Test void orderLookupIsBoundToVerifiedCustomerId(){
        when(customerIdentity.customerId(42L,"Bearer signed.token")).thenReturn(8L);
        when(orders.findByIdAndCustomerId(100L,8L)).thenReturn(java.util.Optional.empty());
        assertThrows(ResponseStatusException.class,()->service.getOrder(42L,"Bearer signed.token",100L));
        verify(orders).findByIdAndCustomerId(100L,8L);
    }
}
