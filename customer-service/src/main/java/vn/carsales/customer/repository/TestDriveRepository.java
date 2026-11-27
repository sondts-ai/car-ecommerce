package vn.carsales.customer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.carsales.customer.domain.TestDrive;
import vn.carsales.customer.domain.TestDriveStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TestDriveRepository extends JpaRepository<TestDrive, Long> {
    List<TestDrive> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<TestDrive> findByIdAndUserId(Long id, Long userId);
    List<TestDrive> findAllByOrderByCreatedAtDesc();
    List<TestDrive> findByCarSlugAndShowroomIdAndDriveDateAndStatusNotIn(
            String carSlug, String showroomId, LocalDate driveDate,
            Collection<TestDriveStatus> statuses);
    boolean existsByCarSlugAndShowroomIdAndDriveDateAndDriveTimeAndStatusNotIn(
            String carSlug, String showroomId, LocalDate driveDate, LocalTime driveTime,
            Collection<TestDriveStatus> statuses);
}
