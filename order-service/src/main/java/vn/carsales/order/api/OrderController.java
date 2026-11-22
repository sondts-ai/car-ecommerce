package vn.carsales.order.api;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import vn.carsales.order.security.OrderPrincipal;
import vn.carsales.order.service.OrderQueryService;

@RestController
@RequestMapping("/api/v1/me")
public class OrderController {
    private final OrderQueryService service;
    private final String internalKey;
    public OrderController(OrderQueryService service,@Value("${app.internal-key}")String internalKey){this.service=service;this.internalKey=internalKey;}
    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderDtos.OrderView> createOrder(Authentication auth,@RequestHeader("Authorization")String token,@Valid @RequestBody OrderDtos.CreateOrderRequest request){
        return ApiResponse.ok("Order created",service.createOrder(principal(auth).userId(),token,request));
    }
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
    @GetMapping("/internal/orders/{orderId}")
    public ApiResponse<OrderDtos.OrderOwnershipView> orderOwnership(
            @RequestHeader("X-Internal-Key") String key,
            @RequestParam("customerId") Long customerId,
            @PathVariable Long orderId){
        if(!internalKey.equals(key)) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"Invalid internal key");
        return ApiResponse.ok("Order ownership",service.verifyOwnership(orderId,customerId));
    }
    @PostMapping("/internal/orders/{orderId}/deposit-paid")
    public ApiResponse<Void> markDepositPaid(@RequestHeader("X-Internal-Key")String key,@PathVariable Long orderId,@Valid @RequestBody OrderDtos.DepositPaidRequest request){
        if(!internalKey.equals(key)) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"Invalid internal key");
        service.markDepositPaid(orderId,request.paymentReference());
        return ApiResponse.ok("Order marked as deposit paid",null);
    }
    private OrderPrincipal principal(Authentication auth){return (OrderPrincipal)auth.getPrincipal();}
}
