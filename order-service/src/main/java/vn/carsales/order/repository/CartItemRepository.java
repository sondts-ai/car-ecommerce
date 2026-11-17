package vn.carsales.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.order.domain.CartItem;
import java.util.List;

public interface CartItemRepository extends JpaRepository<CartItem,Long>{
    List<CartItem> findAllByCartIdOrderByAddedAtDesc(Long cartId);
    long deleteByCartIdAndVehicleId(Long cartId,Long vehicleId);
    long deleteAllByCartId(Long cartId);
}
