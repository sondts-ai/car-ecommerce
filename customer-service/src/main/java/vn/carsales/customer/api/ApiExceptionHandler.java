package vn.carsales.customer.api;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<String>> validation(MethodArgumentNotValidException ex){
        String details=ex.getBindingResult().getFieldErrors().stream().map(e->e.getField()+": "+e.getDefaultMessage()).collect(Collectors.joining("; "));
        return ResponseEntity.badRequest().body(new ApiResponse<>(false,"Invalid request",details));
    }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiResponse<Void>> status(ResponseStatusException ex){
        return ResponseEntity.status(ex.getStatusCode()).body(new ApiResponse<>(false,ex.getReason(),null));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> constraint(DataIntegrityViolationException ex){
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse<>(false,"A database constraint was not satisfied",null));
    }
}
