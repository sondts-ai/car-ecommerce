package vn.carsales.payment.service;

import java.math.BigDecimal;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.payment.api.ApiResponse;

@Component
public class OrderOwnershipClient {
    private static final ParameterizedTypeReference<ApiResponse<OrderOwnership>> TYPE =
            new ParameterizedTypeReference<>() {};
    private final RestClient client;
    private final String internalKey;

    public OrderOwnershipClient(RestClient.Builder builder,
                                @Value("${app.order-service.base-url}") String baseUrl,
                                @Value("${app.order-service.internal-key}") String internalKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(4));
        this.client = builder.baseUrl(baseUrl).requestFactory(factory).build();
        this.internalKey = internalKey;
    }

    public OrderOwnership verify(Long orderId, Long customerId) {
        try {
            ApiResponse<OrderOwnership> response = client.get()
                    .uri("/api/v1/me/internal/orders/{orderId}?customerId={customerId}",
                            orderId, customerId)
                    .header("X-Internal-Key", internalKey)
                    .retrieve().body(TYPE);
            if (response == null || !response.success() || response.data() == null)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Order Service returned an invalid ownership response");
            return response.data();
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND)
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Order not found");
            if (e.getStatusCode() == HttpStatus.FORBIDDEN)
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Order does not belong to the customer");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Order Service rejected the ownership request");
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Order Service is unavailable");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not verify order ownership");
        }
    }

    public record OrderOwnership(Long orderId, Long customerId,
                                 BigDecimal depositAmount, BigDecimal totalAmount) {}
}
