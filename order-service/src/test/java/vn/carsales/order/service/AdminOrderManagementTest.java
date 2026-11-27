package vn.carsales.order.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.order.domain.CustomerOrder;
import vn.carsales.order.domain.OrderStatus;
import vn.carsales.order.domain.OrderStatusHistory;
import vn.carsales.order.repository.CustomerOrderRepository;
import vn.carsales.order.repository.OrderItemRepository;
import vn.carsales.order.repository.OrderStatusHistoryRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminOrderManagementTest {
    private CustomerOrderRepository orders;
    private OrderStatusHistoryRepository history;
    private OrderQueryService service;

    @BeforeEach
    void setUp() {
        orders = mock(CustomerOrderRepository.class);
        history = mock(OrderStatusHistoryRepository.class);
        service = new OrderQueryService(
                null,
                null,
                orders,
                mock(OrderItemRepository.class),
                history,
                null);
    }

    @Test
    void confirmsOnlyAnOrderWhoseDepositIsPaidAndRecordsAdminAction() {
        CustomerOrder order = orderWithStatus(OrderStatus.DEPOSIT_PAID);
        when(orders.findById(12L)).thenReturn(Optional.of(order));

        service.updateAdminOrderStatus(12L, OrderStatus.CONFIRMED, "Đã đối soát tiền cọc", 7L);

        assertEquals(OrderStatus.CONFIRMED, order.getStatus());
        verify(orders).save(order);
        verify(history).save(argThat(change ->
                change.getOldStatus() == OrderStatus.DEPOSIT_PAID
                        && change.getNewStatus() == OrderStatus.CONFIRMED
                        && change.getChangedBy().equals(7L)));
    }

    @Test
    void rejectsConfirmationBeforeDepositPayment() {
        CustomerOrder order = orderWithStatus(OrderStatus.PENDING_DEPOSIT);
        when(orders.findById(12L)).thenReturn(Optional.of(order));

        assertThrows(ResponseStatusException.class,
                () -> service.updateAdminOrderStatus(12L, OrderStatus.CONFIRMED, "Confirm", 7L));

        assertEquals(OrderStatus.PENDING_DEPOSIT, order.getStatus());
        verify(orders, never()).save(any());
        verify(history, never()).save(any());
    }

    @Test
    void allowsCancellingAnUnpaidOrder() {
        CustomerOrder order = orderWithStatus(OrderStatus.PENDING_DEPOSIT);
        when(orders.findById(12L)).thenReturn(Optional.of(order));

        service.updateAdminOrderStatus(12L, OrderStatus.CANCELLED, "Khách không tiếp tục", 7L);

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(orders).save(order);
        verify(history).save(any(OrderStatusHistory.class));
    }

    private CustomerOrder orderWithStatus(OrderStatus status) {
        CustomerOrder order = new CustomerOrder();
        order.setStatus(status);
        return order;
    }
}
