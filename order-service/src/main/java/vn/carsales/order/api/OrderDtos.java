package vn.carsales.order.api;

import vn.carsales.order.domain.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

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
    public record CreateOrderRequest(
            @NotNull @Positive Long vehicleId,
            @NotBlank String vehicleName,
            @NotBlank String vin,
            @NotNull @Positive BigDecimal price,
            @NotNull @Positive BigDecimal depositAmount,
            String note,
            @Positive Integer reservationMinutes){}
    public record DepositPaidRequest(@NotBlank String paymentReference){}
    public record OrderOwnershipView(Long orderId,Long customerId,BigDecimal depositAmount,BigDecimal totalAmount){}
}
