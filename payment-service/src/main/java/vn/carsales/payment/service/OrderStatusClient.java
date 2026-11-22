package vn.carsales.payment.service;

import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class OrderStatusClient {
    private final RestClient client;
    private final String internalKey;

    public OrderStatusClient(
            RestClient.Builder builder,
            @Value("${app.order-service.base-url}") String baseUrl,
            @Value("${app.order-service.internal-key}") String internalKey) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(4));
        this.client = builder.baseUrl(baseUrl).requestFactory(factory).build();
        this.internalKey = internalKey;
    }

    public void markDepositPaid(Long orderId, String paymentReference) {
        client.post()
                .uri("/api/v1/me/internal/orders/{id}/deposit-paid", orderId)
                .header("X-Internal-Key", internalKey)
                .body(new DepositPaidRequest(paymentReference))
                .retrieve()
                .toBodilessEntity();
    }

    private record DepositPaidRequest(String paymentReference) {}
}
