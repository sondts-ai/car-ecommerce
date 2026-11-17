package vn.carsales.order.api;

import vn.carsales.order.domain.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class OrderDtos {
    private OrderDtos(){}
    public record CartItemView(Long vehicleId,LocalDateTime addedAt){}
    public record CartView(Long id,CartStatus status,LocalDateTime createdAt,LocalDateTime updatedAt,List<CartItemView> items){}
    public record OrderItemView(Long vehicleId,String vehicleName,String vin,BigDecimal price){}
    public record OrderView(Long id,String orderCode,BigDecimal subtotal,BigDecimal totalAmount,BigDecimal depositAmount,
          BigDecimal remainingAmount,OrderStatus status,LocalDateTime reservedUntil,String note,
          LocalDateTime createdAt,LocalDateTime updatedAt,List<OrderItemView> items){}
    public record StatusHistoryView(OrderStatus oldStatus,OrderStatus newStatus,String note,Long changedBy,LocalDateTime createdAt){}
    public record CartRemovalView(long removedItems){}
}
