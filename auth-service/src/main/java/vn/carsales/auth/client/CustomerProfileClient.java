package vn.carsales.auth.client;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Tạo profile bên Customer Service ngay sau khi đăng ký tài khoản.
 *
 * Đây là thao tác best-effort: nếu Customer Service chưa chạy, việc đăng ký vẫn
 * thành công và profile sẽ được tạo muộn hơn qua POST /customers/me.
 */
@Component
public class CustomerProfileClient {

    private static final Logger log = LoggerFactory.getLogger(CustomerProfileClient.class);

    private final RestClient client;

    public CustomerProfileClient(RestClient.Builder builder,
                                 @Value("${app.customer-service.url:http://localhost:8082}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.client = builder.baseUrl(baseUrl).requestFactory(factory).build();
    }

    public void createProfile(String bearerToken, String fullName) {
        try {
            client.post()
                    .uri("/api/v1/customers/me")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("fullName", fullName, "gender", "OTHER"))
                    .retrieve()
                    .toBodilessEntity();
        } catch (org.springframework.web.client.RestClientResponseException ex) {
            if (ex.getStatusCode().value() == 409) {
                return; // profile đã tồn tại
            }
            throw ex;
        }
    }

    /** Gọi an toàn: không bao giờ làm fail luồng đăng ký. */
    public void createProfileQuietly(String bearerToken, String fullName) {
        try {
            createProfile(bearerToken, fullName);
        } catch (Exception ex) {
            log.warn("Không tạo được customer profile cho '{}': {}", fullName, ex.getMessage());
        }
    }
}
