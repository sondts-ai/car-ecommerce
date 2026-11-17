package vn.carsales.order.api;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.carsales.order.security.OrderPrincipal;
import vn.carsales.order.service.OrderQueryService;

@RestController
@RequestMapping("/api/v1/me")
public class OrderController {
    private final OrderQueryService service;
    public OrderController(OrderQueryService service){this.service=service;}
    @GetMapping("/cart")
    public ApiResponse<OrderDtos.CartView> cart(Authentication auth,@RequestHeader("Authorization")String token){
        return ApiResponse.ok("Active cart",service.currentCart(principal(auth).userId(),token));
    }
    @DeleteMapping("/cart/items/{vehicleId}")
    public ApiResponse<OrderDtos.CartRemovalView> removeCartItem(Authentication auth,@RequestHeader("Authorization")String token,@PathVariable Long vehicleId){
        return ApiResponse.ok("Vehicle removed from cart",service.removeItem(principal(auth).userId(),token,vehicleId));
    }
    @DeleteMapping("/cart/items")
    public ApiResponse<OrderDtos.CartRemovalView> clearCart(Authentication auth,@RequestHeader("Authorization")String token){
        return ApiResponse.ok("Cart cleared",service.clearCart(principal(auth).userId(),token));
    }
    @GetMapping("/orders")
    public ApiResponse<?> listOrders(Authentication auth,@RequestHeader("Authorization")String token){
        return ApiResponse.ok("Customer orders",service.listOrders(principal(auth).userId(),token));
    }
    @GetMapping("/orders/{orderId}")
    public ApiResponse<OrderDtos.OrderView> getOrder(Authentication auth,@RequestHeader("Authorization")String token,@PathVariable Long orderId){
        return ApiResponse.ok("Order details",service.getOrder(principal(auth).userId(),token,orderId));
    }
    @GetMapping("/orders/{orderId}/history")
    public ApiResponse<?> history(Authentication auth,@RequestHeader("Authorization")String token,@PathVariable Long orderId){
        return ApiResponse.ok("Order status history",service.statusHistory(principal(auth).userId(),token,orderId));
    }
    private OrderPrincipal principal(Authentication auth){return (OrderPrincipal)auth.getPrincipal();}
}
