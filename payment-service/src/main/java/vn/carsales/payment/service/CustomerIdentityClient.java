package vn.carsales.payment.service;

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
public class CustomerIdentityClient {
    private static final ParameterizedTypeReference<ApiResponse<CustomerProfile>> TYPE =
            new ParameterizedTypeReference<>() {};
    private final RestClient client;

    public CustomerIdentityClient(RestClient.Builder builder,
                                  @Value("${app.customer-service.base-url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(4));
        this.client = builder.baseUrl(baseUrl).requestFactory(factory).build();
    }

    public Long customerId(Long userId, String token) {
        try {
            String jwt = token != null && token.startsWith("Bearer ")
                    ? token.substring(7).trim() : token;
            ApiResponse<CustomerProfile> response = client.get()
                    .uri("/api/v1/customers/me")
                    .header("Authorization", "Bearer " + jwt)
                    .retrieve().body(TYPE);
            if (response == null || !response.success() || response.data() == null
                    || response.data().customerId() == null)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Customer Service returned an invalid identity response");
            if (!userId.equals(response.data().userId()))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Customer identity does not match the JWT");
            return response.data().customerId();
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.UNAUTHORIZED
                    || e.getStatusCode() == HttpStatus.FORBIDDEN)
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "Customer Service rejected the account token");
            if (e.getStatusCode() == HttpStatus.NOT_FOUND)
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Create the customer profile before using Payment Service");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Customer Service rejected the identity request");
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Customer Service is unavailable");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Could not verify customer identity");
        }
    }

    public record CustomerProfile(Long customerId, Long userId) {}
}
