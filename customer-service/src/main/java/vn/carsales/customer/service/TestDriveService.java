package vn.carsales.customer.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import vn.carsales.customer.api.TestDriveDtos;
import vn.carsales.customer.domain.TestDrive;
import vn.carsales.customer.domain.TestDriveStatus;
import vn.carsales.customer.repository.TestDriveRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class TestDriveService {
    private static final Set<String> SHOWROOMS = Set.of("hn-tay-ho", "hcm-q7", "dn-hai-chau");
    private static final Set<TestDriveStatus> INACTIVE_STATUSES =
            Set.of(TestDriveStatus.CANCELLED, TestDriveStatus.REJECTED);
    private static final List<LocalTime> SLOTS = List.of(
            LocalTime.of(8, 30), LocalTime.of(9, 30), LocalTime.of(10, 30),
            LocalTime.of(11, 30), LocalTime.of(13, 30), LocalTime.of(14, 30),
            LocalTime.of(15, 30), LocalTime.of(16, 30), LocalTime.of(17, 30));
    private static final Pattern NAME = Pattern.compile("^[\\p{L}\\s.'-]+$");
    private final TestDriveRepository testDrives;

    public TestDriveService(TestDriveRepository testDrives) {
        this.testDrives = testDrives;
    }

    @Transactional(readOnly = true)
    public TestDriveDtos.ListView listForCustomer(Long userId) {
        return new TestDriveDtos.ListView(testDrives.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::view).toList());
    }

    @Transactional
    public TestDriveDtos.View create(Long userId, TestDriveDtos.CreateInput input) {
        if (!SHOWROOMS.contains(input.showroomId())) {
            throw badRequest("Showroom không hợp lệ.");
        }
        if (!input.hasLicense()) {
            throw badRequest("Bạn cần có giấy phép lái xe hợp lệ.");
        }
        String phone = input.customer().phone().replaceAll("[\\s.-]", "");
        String fullName = input.customer().fullName().trim();
        if (!phone.matches("^0\\d{9}$")) {
            throw badRequest("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.");
        }
        if (fullName.length() < 3 || !NAME.matcher(fullName).matches()) {
            throw badRequest("Họ tên không hợp lệ.");
        }

        LocalDate date;
        LocalTime time;
        try {
            date = LocalDate.parse(input.date());
            time = LocalTime.parse(input.time());
        } catch (DateTimeParseException ex) {
            throw badRequest("Ngày hoặc giờ lái thử không hợp lệ.");
        }
        validateDate(date);
        if (!SLOTS.contains(time)) throw badRequest("Khung giờ lái thử không hợp lệ.");
        if (testDrives.existsByCarSlugAndShowroomIdAndDriveDateAndDriveTimeAndStatusNotIn(
                input.carSlug(), input.showroomId(), date, time, INACTIVE_STATUSES)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khung giờ này đã được đặt.");
        }

        TestDrive item = new TestDrive();
        item.setUserId(userId);
        item.setCode("TD-" + date.toString().replace("-", "") + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        item.setCarSlug(input.carSlug().trim());
        item.setCarName(input.carName() == null || input.carName().isBlank()
                ? input.carSlug().trim() : input.carName().trim());
        item.setShowroomId(input.showroomId());
        item.setDriveDate(date);
        item.setDriveTime(time);
        item.setNote(input.note() == null || input.note().isBlank() ? null : input.note().trim());
        item.setStatus(TestDriveStatus.PENDING);
        item.setCustomerFullName(fullName);
        item.setCustomerPhone(phone);
        item.setCustomerEmail(input.customer().email() == null || input.customer().email().isBlank()
                ? null : input.customer().email().trim().toLowerCase(Locale.ROOT));
        return view(testDrives.saveAndFlush(item));
    }

    @Transactional(readOnly = true)
    public TestDriveDtos.SlotsView slots(String carSlug, String showroomId, String dateText) {
        if (carSlug == null || !carSlug.matches("^[a-zA-Z0-9-]{1,100}$")) {
            throw badRequest("Mẫu xe không hợp lệ.");
        }
        if (!SHOWROOMS.contains(showroomId)) throw badRequest("Showroom không hợp lệ.");
        LocalDate date;
        try {
            date = LocalDate.parse(dateText);
        } catch (DateTimeParseException | NullPointerException ex) {
            throw badRequest("Ngày lái thử không hợp lệ.");
        }
        validateDate(date);

        Set<LocalTime> booked = testDrives
                .findByCarSlugAndShowroomIdAndDriveDateAndStatusNotIn(
                        carSlug, showroomId, date, INACTIVE_STATUSES)
                .stream().map(TestDrive::getDriveTime).collect(java.util.stream.Collectors.toSet());
        List<TestDriveDtos.Slot> slots = SLOTS.stream()
                .map(slot -> new TestDriveDtos.Slot(slot.toString(), !booked.contains(slot))).toList();
        return new TestDriveDtos.SlotsView(carSlug, showroomId, date, slots);
    }

    @Transactional(readOnly = true)
    public TestDriveDtos.ListView listAll() {
        return new TestDriveDtos.ListView(testDrives.findAllByOrderByCreatedAtDesc().stream()
                .map(this::view).toList());
    }

    @Transactional
    public TestDriveDtos.View updateStatus(Long id, TestDriveStatus nextStatus) {
        TestDrive item = testDrives.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch lái thử."));
        return updateStatus(item, nextStatus);
    }

    @Transactional
    public TestDriveDtos.View cancelForCustomer(Long userId, Long id) {
        TestDrive item = testDrives.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch lái thử."));
        return updateStatus(item, TestDriveStatus.CANCELLED);
    }

    private TestDriveDtos.View updateStatus(TestDrive item, TestDriveStatus nextStatus) {
        if (!canTransition(item.getStatus(), nextStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Không thể chuyển trạng thái từ " + item.getStatus() + " sang " + nextStatus + ".");
        }
        item.setStatus(nextStatus);
        return view(testDrives.saveAndFlush(item));
    }

    static boolean canTransition(TestDriveStatus current, TestDriveStatus next) {
        return switch (current) {
            case PENDING -> next == TestDriveStatus.CONFIRMED
                    || next == TestDriveStatus.CANCELLED
                    || next == TestDriveStatus.REJECTED;
            case CONFIRMED -> next == TestDriveStatus.COMPLETED || next == TestDriveStatus.CANCELLED;
            case COMPLETED, CANCELLED, REJECTED -> false;
        };
    }

    private void validateDate(LocalDate date) {
        LocalDate today = LocalDate.now();
        if (date.isBefore(today)) throw badRequest("Không thể chọn ngày trong quá khứ.");
        if (date.isAfter(today.plusDays(30))) throw badRequest("Chỉ nhận lịch trong vòng 30 ngày tới.");
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private TestDriveDtos.View view(TestDrive item) {
        return new TestDriveDtos.View(item.getId(), item.getCode(), item.getCarSlug(), item.getCarName(),
                item.getShowroomId(), item.getDriveDate(), item.getDriveTime(), item.getNote(),
                item.getStatus().name(),
                new TestDriveDtos.CustomerView(item.getCustomerFullName(), item.getCustomerPhone(),
                        item.getCustomerEmail()), item.getCreatedAt());
    }
}
