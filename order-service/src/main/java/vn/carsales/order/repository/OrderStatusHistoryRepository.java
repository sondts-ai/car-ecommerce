package vn.carsales.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.order.domain.OrderStatusHistory;
import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory,Long>{
    List<OrderStatusHistory> findAllByOrderIdOrderByCreatedAtAsc(Long orderId);
}
