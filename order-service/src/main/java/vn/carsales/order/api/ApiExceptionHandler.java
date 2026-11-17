package vn.carsales.order.api;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler{
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiResponse<Void>> status(ResponseStatusException ex){return ResponseEntity.status(ex.getStatusCode()).body(new ApiResponse<>(false,ex.getReason(),null));}
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> constraint(DataIntegrityViolationException ex){return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse<>(false,"A database constraint was not satisfied",null));}
}
