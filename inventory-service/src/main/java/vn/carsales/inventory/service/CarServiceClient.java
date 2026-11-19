package vn.carsales.inventory.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import vn.carsales.inventory.api.ApiResponse;

/**
 * Gọi car-service qua REST (timeout 3 giây).
 * Lỗi kết nối/timeout -> 503; car-service trả lỗi khác 404 -> 502. Không tự đoán dữ liệu khi gọi thất bại.
 * Token của request hiện tại được chuyển tiếp sang car-service.
 */
@Component
public class CarServiceClient {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record VersionInfo(Long versionId, String versionName, Long modelId, String modelName,
                              Long brandId, String brandName, String fuelType, String transmission,
                              Integer seats) {
        public String fullName() {
            return String.join(" ", brandName, modelName, versionName);
        }
    }

    private final RestClient client;

    public CarServiceClient(@Value("${app.car-service.url}") String baseUrl) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }

    /** @return empty nếu car-service trả 404 (phiên bản không tồn tại). */
    public Optional<VersionInfo> findVersion(Long versionId) {
        try {
            ApiResponse<VersionInfo> resp = client.get()
                    .uri("/api/v1/internal/versions/{id}", versionId)
                    .headers(h -> {
                        String token = currentAuthorization();
                        if (token != null) {
                            h.set(HttpHeaders.AUTHORIZATION, token);
                        }
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<VersionInfo>>() {
                    });
            if (resp == null || resp.data() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Car Service trả dữ liệu không hợp lệ");
            }
            return Optional.of(resp.data());
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Không kết nối được Car Service");
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Car Service trả về lỗi");
        }
    }

    private static String currentAuthorization() {
        RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
        if (attrs instanceof ServletRequestAttributes sra) {
            return sra.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
        }
        return null;
    }
}
