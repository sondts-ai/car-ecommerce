package vn.carsales.customer.api;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class TestDriveDtos {
    private TestDriveDtos() {}

    public record CustomerInput(
            @NotBlank @Size(min = 3, max = 150) String fullName,
            @NotBlank @Size(max = 20) String phone,
            @Pattern(regexp = "^$|^\\S+@\\S+\\.\\S{2,}$") @Size(max = 254) String email) {}

    public record CreateInput(
            @NotBlank @Pattern(regexp = "^[a-zA-Z0-9-]{1,100}$") String carSlug,
            @Size(max = 150) String carName,
            @NotBlank @Size(max = 20) String showroomId,
            @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$") String date,
            @NotBlank @Pattern(regexp = "^\\d{2}:\\d{2}$") String time,
            @Size(max = 1000) String note,
            boolean hasLicense,
            @NotNull @Valid CustomerInput customer) {}

    public record CustomerView(String fullName, String phone, String email) {}

    public record View(Long id, String code, String carSlug, String carName, String showroomId,
                       LocalDate date, @JsonFormat(pattern = "HH:mm") LocalTime time, String note, String status,
                       CustomerView customer, LocalDateTime createdAt) {}

    public record ListView(List<View> items) {}
    public record Slot(String time, boolean available) {}
    public record SlotsView(String carSlug, String showroomId, LocalDate date, List<Slot> slots) {}
    public record StatusInput(@NotNull vn.carsales.customer.domain.TestDriveStatus status) {}
}
