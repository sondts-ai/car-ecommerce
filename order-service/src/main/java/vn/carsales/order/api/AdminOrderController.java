package vn.carsales.order.api;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.carsales.order.security.OrderPrincipal;
import vn.carsales.order.service.OrderQueryService;
import vn.carsales.order.domain.CustomerOrder;
import vn.carsales.order.domain.OrderStatus;
import vn.carsales.order.repository.CustomerOrderRepository;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * API thống kê đơn hàng cho trang quản trị.
 * Bảo vệ bởi SecurityConfig: chỉ JWT có role ADMIN mới gọi được /api/v1/admin/**.
 */
@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {
    private static final Set<OrderStatus> DEPOSIT_STATUSES = Set.of(
            OrderStatus.DEPOSIT_PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.WAITING_REMAINING_PAYMENT,
            OrderStatus.COMPLETED);

    private final CustomerOrderRepository orders;
    private final OrderQueryService orderService;

    public AdminOrderController(CustomerOrderRepository orders, OrderQueryService orderService) {
        this.orders = orders;
        this.orderService = orderService;
    }

    @GetMapping
    public ApiResponse<List<OrderDtos.AdminOrderView>> orders() {
        return ApiResponse.ok("Admin orders", orderService.adminOrders());
    }

    @PutMapping("/{orderId}/status")
    public ApiResponse<Void> updateStatus(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody OrderDtos.AdminOrderStatusRequest request) {
        OrderPrincipal admin = (OrderPrincipal) authentication.getPrincipal();
        orderService.updateAdminOrderStatus(orderId, request.status(), request.note(), admin.userId());
        return ApiResponse.ok("Order status updated", null);
    }

    @GetMapping("/stats")
    public ApiResponse<OrderDtos.AdminOrderStatsView> stats() {
        List<CustomerOrder> all = orders.findAll();

        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus status : OrderStatus.values()) {
            byStatus.put(status, 0L);
        }
        for (CustomerOrder order : all) {
            byStatus.merge(order.getStatus(), 1L, Long::sum);
        }

        BigDecimal totalRevenue = all.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .map(CustomerOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDepositRevenue = all.stream()
                .filter(o -> DEPOSIT_STATUSES.contains(o.getStatus()))
                .map(CustomerOrder::getDepositAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ApiResponse.ok("Admin order statistics",
                new OrderDtos.AdminOrderStatsView(
                        all.size(),
                        byStatus.get(OrderStatus.PENDING_DEPOSIT),
                        byStatus.get(OrderStatus.DEPOSIT_PAID),
                        byStatus.get(OrderStatus.CONFIRMED),
                        byStatus.get(OrderStatus.COMPLETED),
                        byStatus.get(OrderStatus.CANCELLED),
                        totalRevenue,
                        totalDepositRevenue,
                        monthlyRevenue(all)));
    }

    /** Doanh thu 6 tháng gần nhất (tháng cũ → mới) dựa trên đơn COMPLETED. */
    private List<OrderDtos.MonthlyRevenueView> monthlyRevenue(List<CustomerOrder> all) {
        YearMonth current = YearMonth.now();
        List<OrderDtos.MonthlyRevenueView> result = new ArrayList<>(6);
        for (int i = 5; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            BigDecimal revenue = BigDecimal.ZERO;
            long count = 0;
            for (CustomerOrder order : all) {
                if (order.getStatus() == OrderStatus.COMPLETED
                        && order.getCreatedAt() != null
                        && YearMonth.from(order.getCreatedAt()).equals(month)) {
                    revenue = revenue.add(order.getTotalAmount());
                    count++;
                }
            }
            result.add(new OrderDtos.MonthlyRevenueView(month.toString(), revenue, count));
        }
        return result;
    }
}
