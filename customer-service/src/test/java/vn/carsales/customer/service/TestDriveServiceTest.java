package vn.carsales.customer.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.TestDriveDtos;
import vn.carsales.customer.domain.TestDrive;
import vn.carsales.customer.domain.TestDriveStatus;
import vn.carsales.customer.repository.TestDriveRepository;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestDriveServiceTest {
    @Mock TestDriveRepository testDrives;
    @InjectMocks TestDriveService service;

    @Test
    void enforcesOnlyDocumentedStatusTransitions() {
        assertTrue(TestDriveService.canTransition(TestDriveStatus.PENDING, TestDriveStatus.CONFIRMED));
        assertTrue(TestDriveService.canTransition(TestDriveStatus.PENDING, TestDriveStatus.CANCELLED));
        assertTrue(TestDriveService.canTransition(TestDriveStatus.PENDING, TestDriveStatus.REJECTED));
        assertTrue(TestDriveService.canTransition(TestDriveStatus.CONFIRMED, TestDriveStatus.COMPLETED));
        assertTrue(TestDriveService.canTransition(TestDriveStatus.CONFIRMED, TestDriveStatus.CANCELLED));
        assertFalse(TestDriveService.canTransition(TestDriveStatus.PENDING, TestDriveStatus.COMPLETED));
        assertFalse(TestDriveService.canTransition(TestDriveStatus.COMPLETED, TestDriveStatus.CANCELLED));
        assertFalse(TestDriveService.canTransition(TestDriveStatus.CANCELLED, TestDriveStatus.CONFIRMED));
        assertFalse(TestDriveService.canTransition(TestDriveStatus.REJECTED, TestDriveStatus.CONFIRMED));
    }

    @Test
    void rejectsBookingWhenPersistedSlotIsTaken() {
        LocalDate date = LocalDate.now().plusDays(1);
        var input = new TestDriveDtos.CreateInput("car-s450", "Mercedes S-Class",
                "hn-tay-ho", date.toString(), "09:30", null, true,
                new TestDriveDtos.CustomerInput("Test Customer", "0912345678", null));
        when(testDrives.existsByCarSlugAndShowroomIdAndDriveDateAndDriveTimeAndStatusNotIn(
                "car-s450", "hn-tay-ho", date, LocalTime.of(9, 30),
                Set.of(TestDriveStatus.CANCELLED, TestDriveStatus.REJECTED))).thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.create(7L, input));
        assertEquals(409, error.getStatusCode().value());
        verify(testDrives, never()).saveAndFlush(any());
    }

    @Test
    void persistsSubmittedCarNameAndUppercasePendingStatus() {
        LocalDate date = LocalDate.now().plusDays(1);
        var input = new TestDriveDtos.CreateInput("car-s450", "Mercedes S-Class", "hn-tay-ho",
                date.toString(), "09:30", null, true,
                new TestDriveDtos.CustomerInput("Test Customer", "0912345678", null));
        when(testDrives.existsByCarSlugAndShowroomIdAndDriveDateAndDriveTimeAndStatusNotIn(
                "car-s450", "hn-tay-ho", date, LocalTime.of(9, 30),
                Set.of(TestDriveStatus.CANCELLED, TestDriveStatus.REJECTED))).thenReturn(false);
        when(testDrives.saveAndFlush(any())).thenAnswer(invocation -> {
            var saved = invocation.<vn.carsales.customer.domain.TestDrive>getArgument(0);
            return saved;
        });

        var result = service.create(7L, input);
        assertEquals("Mercedes S-Class", result.carName());
        assertEquals("PENDING", result.status());
        verify(testDrives).saveAndFlush(any());
    }

    @Test
    void usesCarSlugWhenOptionalCarNameIsNotProvided() {
        LocalDate date = LocalDate.now().plusDays(1);
        var input = new TestDriveDtos.CreateInput("car-s450", null, "hn-tay-ho",
                date.toString(), "09:30", null, true,
                new TestDriveDtos.CustomerInput("Test Customer", "0912345678", null));
        when(testDrives.existsByCarSlugAndShowroomIdAndDriveDateAndDriveTimeAndStatusNotIn(
                "car-s450", "hn-tay-ho", date, LocalTime.of(9, 30),
                Set.of(TestDriveStatus.CANCELLED, TestDriveStatus.REJECTED))).thenReturn(false);
        when(testDrives.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var result = service.create(null, input);
        ArgumentCaptor<TestDrive> saved = ArgumentCaptor.forClass(TestDrive.class);
        verify(testDrives).saveAndFlush(saved.capture());
        assertEquals("car-s450", result.carName());
        assertNull(saved.getValue().getUserId());
    }

    @Test
    void customerCanCancelOnlyTheirPendingAppointment() {
        TestDrive appointment = new TestDrive();
        appointment.setStatus(TestDriveStatus.PENDING);
        appointment.setCode("TD-1");
        appointment.setCarSlug("car-s450");
        appointment.setCarName("Mercedes S-Class");
        appointment.setShowroomId("hn-tay-ho");
        appointment.setDriveDate(LocalDate.now().plusDays(1));
        appointment.setDriveTime(LocalTime.of(9, 30));
        appointment.setCustomerFullName("Test Customer");
        appointment.setCustomerPhone("0912345678");
        when(testDrives.findByIdAndUserId(12L, 7L)).thenReturn(java.util.Optional.of(appointment));
        when(testDrives.saveAndFlush(appointment)).thenReturn(appointment);

        TestDriveDtos.View result = service.cancelForCustomer(7L, 12L);

        assertEquals("CANCELLED", result.status());
        verify(testDrives).findByIdAndUserId(12L, 7L);
        verify(testDrives).saveAndFlush(appointment);
    }

    @Test
    void customerCannotCancelAnotherCustomersAppointment() {
        when(testDrives.findByIdAndUserId(12L, 7L)).thenReturn(java.util.Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class, () -> service.cancelForCustomer(7L, 12L));

        assertEquals(404, error.getStatusCode().value());
        verify(testDrives, never()).saveAndFlush(any());
    }
}
