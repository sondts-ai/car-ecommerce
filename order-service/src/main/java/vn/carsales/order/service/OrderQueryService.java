package vn.carsales.order.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.order.api.OrderDtos.*;
import vn.carsales.order.domain.*;
import vn.carsales.order.repository.*;
import java.util.*;
import java.util.stream.Collectors;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class OrderQueryService {
    private final CartRepository carts;private final CartItemRepository cartItems;
    private final CustomerOrderRepository orders;private final OrderItemRepository orderItems;
    private final OrderStatusHistoryRepository history;private final CustomerIdentityClient customerIdentity;
    public OrderQueryService(CartRepository carts,CartItemRepository cartItems,CustomerOrderRepository orders,
         OrderItemRepository orderItems,OrderStatusHistoryRepository history,CustomerIdentityClient customerIdentity){
        this.carts=carts;this.cartItems=cartItems;this.orders=orders;this.orderItems=orderItems;this.history=history;this.customerIdentity=customerIdentity;
    }
    @Transactional
    public CartView currentCart(Long userId,String token){
        Long customerId=customerIdentity.customerId(userId,token);
        Cart cart=carts.findByCustomerIdAndStatus(customerId,CartStatus.ACTIVE).orElseGet(()->createCart(customerId));
        return cartView(cart,cartItems.findAllByCartIdOrderByAddedAtDesc(cart.getId()));
    }
    private Cart createCart(Long customerId){
        Cart cart=new Cart();cart.setCustomerId(customerId);cart.setStatus(CartStatus.ACTIVE);
        try{return carts.saveAndFlush(cart);}
        catch(DataIntegrityViolationException e){throw new ResponseStatusException(HttpStatus.CONFLICT,"An active cart was created concurrently; retry the request");}
    }
    @Transactional
    public CartRemovalView removeItem(Long userId,String token,Long vehicleId){
        Long customerId=customerIdentity.customerId(userId,token);Cart cart=activeCart(customerId);
        long removed=cartItems.deleteByCartIdAndVehicleId(cart.getId(),vehicleId);
        if(removed==0)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Vehicle is not in the active cart");
        return new CartRemovalView(removed);
    }
    @Transactional
    public CartRemovalView clearCart(Long userId,String token){
        Long customerId=customerIdentity.customerId(userId,token);
        return carts.findByCustomerIdAndStatus(customerId,CartStatus.ACTIVE)
                .map(c->new CartRemovalView(cartItems.deleteAllByCartId(c.getId())))
                .orElseGet(()->new CartRemovalView(0));
    }
    @Transactional(readOnly=true)
    public List<OrderView> listOrders(Long userId,String token){
        Long customerId=customerIdentity.customerId(userId,token);List<CustomerOrder> owned=orders.findAllByCustomerIdOrderByCreatedAtDesc(customerId);
        if(owned.isEmpty())return List.of();
        List<Long> ids=owned.stream().map(CustomerOrder::getId).toList();
        Map<Long,List<OrderItemView>> items=orderItems.findAllByOrderIdInOrderByIdAsc(ids).stream()
                .collect(Collectors.groupingBy(OrderItem::getOrderId,LinkedHashMap::new,Collectors.mapping(this::itemView,Collectors.toList())));
        return owned.stream().map(order->orderView(order,items.getOrDefault(order.getId(),List.of()))).toList();
    }
    @Transactional(readOnly=true)
    public OrderView getOrder(Long userId,String token,Long orderId){
        Long customerId=customerIdentity.customerId(userId,token);CustomerOrder order=ownedOrder(orderId,customerId);
        return orderView(order,orderItems.findAllByOrderIdOrderByIdAsc(orderId).stream().map(this::itemView).toList());
    }
    @Transactional(readOnly=true)
    public List<StatusHistoryView> statusHistory(Long userId,String token,Long orderId){
        Long customerId=customerIdentity.customerId(userId,token);ownedOrder(orderId,customerId);
        return history.findAllByOrderIdOrderByCreatedAtAsc(orderId).stream()
                .map(h->new StatusHistoryView(h.getOldStatus(),h.getNewStatus(),h.getNote(),h.getChangedBy(),h.getCreatedAt())).toList();
    }
    @Transactional
    public OrderView createOrder(Long userId,String token,CreateOrderRequest request){
        Long customerId=customerIdentity.customerId(userId,token);
        if(request.depositAmount().compareTo(request.price())>0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Deposit cannot exceed order total");
        CustomerOrder order=new CustomerOrder();
        order.setOrderCode("ORD-"+UUID.randomUUID().toString().replace("-","").substring(0,12).toUpperCase());
        order.setCustomerId(customerId); order.setSubtotal(request.price()); order.setTotalAmount(request.price());
        order.setDepositAmount(request.depositAmount()); order.setRemainingAmount(request.price().subtract(request.depositAmount()));
        order.setStatus(OrderStatus.PENDING_DEPOSIT);
        order.setReservedUntil(LocalDateTime.now().plusMinutes(request.reservationMinutes()==null?15:request.reservationMinutes()));
        order.setNote(request.note());
        CustomerOrder saved=orders.save(order);
        OrderItem item=new OrderItem(); item.setOrderId(saved.getId()); item.setVehicleId(request.vehicleId());
        item.setVehicleName(request.vehicleName()); item.setVin(request.vin()); item.setPrice(request.price()); orderItems.save(item);
        OrderStatusHistory change=new OrderStatusHistory(); change.setOrderId(saved.getId()); change.setNewStatus(OrderStatus.PENDING_DEPOSIT);
        change.setNote("Order created"); history.save(change);
        return orderView(saved,List.of(item).stream().map(this::itemView).toList());
    }
    @Transactional
    public void markDepositPaid(Long orderId,String paymentReference){
        CustomerOrder order=orders.findById(orderId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));
        if(order.getStatus()==OrderStatus.DEPOSIT_PAID)return;
        if(order.getStatus()!=OrderStatus.PENDING_DEPOSIT)
            throw new ResponseStatusException(HttpStatus.CONFLICT,"Order is not awaiting deposit");
        OrderStatus old=order.getStatus(); order.setStatus(OrderStatus.DEPOSIT_PAID); orders.save(order);
        OrderStatusHistory change=new OrderStatusHistory(); change.setOrderId(orderId); change.setOldStatus(old);
        change.setNewStatus(OrderStatus.DEPOSIT_PAID); change.setNote("Deposit paid: "+paymentReference); history.save(change);
    }
    @Transactional(readOnly=true)
    public OrderOwnershipView verifyOwnership(Long orderId,Long customerId){
        CustomerOrder order=ownedOrder(orderId,customerId);
        return new OrderOwnershipView(order.getId(),order.getCustomerId(),order.getDepositAmount(),order.getTotalAmount());
    }
    private Cart activeCart(Long customerId){return carts.findByCustomerIdAndStatus(customerId,CartStatus.ACTIVE).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Active cart not found"));}
    private CustomerOrder ownedOrder(Long orderId,Long customerId){return orders.findByIdAndCustomerId(orderId,customerId).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found"));}
    private CartView cartView(Cart c,List<CartItem> items){return new CartView(c.getId(),c.getStatus(),c.getCreatedAt(),c.getUpdatedAt(),items.stream().map(i->new CartItemView(i.getVehicleId(),i.getAddedAt())).toList());}
    private OrderItemView itemView(OrderItem i){return new OrderItemView(i.getVehicleId(),i.getVehicleName(),i.getVin(),i.getPrice());}
    private OrderView orderView(CustomerOrder o,List<OrderItemView> items){return new OrderView(o.getId(),o.getOrderCode(),o.getSubtotal(),o.getTotalAmount(),o.getDepositAmount(),o.getRemainingAmount(),o.getStatus(),o.getReservedUntil(),o.getNote(),o.getCreatedAt(),o.getUpdatedAt(),items);}
}
