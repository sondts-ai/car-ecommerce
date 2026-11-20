package vn.carsales.customer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.ApiResponse;
import java.time.Duration;

@Component
public class AuthIdentityClient {
    private static final ParameterizedTypeReference<ApiResponse<AuthUser>> TYPE=new ParameterizedTypeReference<>(){};
    private final RestClient client;
    public AuthIdentityClient(RestClient.Builder builder,@Value("${app.auth-service.base-url}")String baseUrl){
        SimpleClientHttpRequestFactory requestFactory=new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(2));requestFactory.setReadTimeout(Duration.ofSeconds(3));
        client=builder.baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
    public AuthUser currentUser(String bearerToken){
        try{
            ApiResponse<AuthUser> response=client.get().uri("/api/v1/auth/me").header("Authorization","Bearer "+bearerToken).retrieve().body(TYPE);
            if(response==null||!response.success()||response.data()==null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Auth Service returned an invalid response");
            return response.data();
        }catch(HttpClientErrorException e){
            if(e.getStatusCode()==HttpStatus.UNAUTHORIZED||e.getStatusCode()==HttpStatus.FORBIDDEN)
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Auth Service rejected this account token");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Auth Service rejected the identity request");
        }catch(ResourceAccessException e){
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Auth Service is unavailable");
        }catch(RestClientException e){
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"Could not read identity from Auth Service");
        }
    }
    public record AuthUser(Long id,String email,String phone,String role,String status){}
}
