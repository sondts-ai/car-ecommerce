package vn.carsales.auth.api;

import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<String>> validation(MethodArgumentNotValidException ex) {
        String message=ex.getBindingResult().getFieldErrors().stream().map(e -> e.getField()+": "+e.getDefaultMessage()).collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ApiResponse<>(false,"Invalid request",message));
    }
    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ApiResponse<Void>> credentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>(false,"Email or password is incorrect",null));
    }
    @ExceptionHandler(DisabledException.class)
    ResponseEntity<ApiResponse<Void>> disabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>(false,"Account is not active",null));
    }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiResponse<Void>> status(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode()).body(new ApiResponse<>(false,ex.getReason(),null));
    }
    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiResponse<Void>> configuration(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse<>(false,ex.getMessage(),null));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> conflict(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse<>(false,"Email or phone is already registered",null));
    }
}
