package vn.carsales.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.order.domain.OrderItem;
import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem,Long>{
    List<OrderItem> findAllByOrderIdOrderByIdAsc(Long orderId);
    List<OrderItem> findAllByOrderIdInOrderByIdAsc(List<Long> orderIds);
}
