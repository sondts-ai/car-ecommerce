package vn.carsales.inventory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.carsales.inventory.domain.Branch;
import vn.carsales.inventory.domain.Enums.VehicleStatus;
import vn.carsales.inventory.domain.Vehicle;
import vn.carsales.inventory.domain.VehicleStatusHistory;
import vn.carsales.inventory.repository.BranchRepository;
import vn.carsales.inventory.repository.InventoryRepository;
import vn.carsales.inventory.repository.VehicleRepository;
import vn.carsales.inventory.repository.VehicleStatusHistoryRepository;
import vn.carsales.inventory.service.CarServiceClient;
import vn.carsales.inventory.service.CarServiceClient.VersionInfo;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InventoryServiceApiTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123456";
    private static final long ADMIN_ID = 7L;

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired BranchRepository branches;
    @Autowired VehicleRepository vehicles;
    @Autowired InventoryRepository inventory;
    @Autowired VehicleStatusHistoryRepository history;
    @MockitoBean CarServiceClient cars;

    Branch hanoi;
    Branch hcm;

    @BeforeEach
    void setUp() {
        when(cars.findVersion(anyLong())).thenReturn(Optional.empty());
        when(cars.findVersion(1L)).thenReturn(Optional.of(
                new VersionInfo(1L, "2.0Q", 1L, "Camry", 1L, "Toyota", "GASOLINE", "AUTO", 5)));
        hanoi = branch("Showroom Hà Nội");
        hcm = branch("Showroom TP.HCM");
    }

    private Branch branch(String name) {
        Branch b = new Branch();
        b.setName(name);
        b.setAddress("Địa chỉ " + name);
        return branches.saveAndFlush(b);
    }

    private String token(String role) {
        return Jwts.builder().issuer("car-sales-auth").claim("userId", ADMIN_ID).claim("role", role)
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private JsonNode call(MockHttpServletRequestBuilder b, int expected) throws Exception {
        String body = mvc.perform(b.header("Authorization", "Bearer " + token("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().is(expected)).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return json.readTree(body);
    }

    private String vehicleBody(String vin, String plate, String condition, int mileage) {
        return "{\"versionId\":1,\"branchId\":" + hanoi.getId() + ",\"vin\":\"" + vin + "\",\"licensePlate\":\""
                + plate + "\",\"condition\":\"" + condition + "\",\"year\":2024,\"color\":\"Trắng\",\"mileage\":"
                + mileage + ",\"price\":1000000000}";
    }

    private long createVehicle(String vin, String plate) throws Exception {
        return call(post("/api/v1/admin/vehicles").content(vehicleBody(vin, plate, "NEW", 0)), 201)
                .path("data").path("id").asLong();
    }

    private void setStatus(long vehicleId, VehicleStatus st) {
        Vehicle v = vehicles.findById(vehicleId).orElseThrow();
        v.setStatus(st);
        vehicles.saveAndFlush(v);
    }

    // ------------------------------------------------------------ tạo xe

    @Test
    void createVehicleWritesInitialHistoryAndFullName() throws Exception {
        JsonNode data = call(post("/api/v1/admin/vehicles")
                .content(vehicleBody("JTNB11HK0M3000001", "30A-123.45", "NEW", 0)), 201).path("data");
        assertThat(data.path("status").asText()).isEqualTo("AVAILABLE");
        assertThat(data.path("name").asText()).isEqualTo("Toyota Camry 2.0Q");

        List<VehicleStatusHistory> h = history.findByVehicleIdOrderByCreatedAtDescIdDesc(data.path("id").asLong());
        assertThat(h).hasSize(1);
        assertThat(h.get(0).getOldStatus()).isNull();
        assertThat(h.get(0).getNewStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        assertThat(h.get(0).getReason()).isEqualTo("Nhập xe");
    }

    @Test
    void createNewVehicleWithMileageReturns400() throws Exception {
        call(post("/api/v1/admin/vehicles").content(vehicleBody("JTNB11HK0M3000001", "30A-1", "NEW", 500)), 400);
    }

    @Test
    void createVehicleWithShortVinReturns400() throws Exception {
        call(post("/api/v1/admin/vehicles").content(vehicleBody("SHORT", "30A-1", "NEW", 0)), 400);
    }

    @Test
    void duplicateVinReturns409() throws Exception {
        createVehicle("JTNB11HK0M3000001", "30A-1");
        call(post("/api/v1/admin/vehicles").content(vehicleBody("jtnb11hk0m3000001", "30A-2", "NEW", 0)), 409);
    }

    @Test
    void unknownVersionReturns400() throws Exception {
        String body = vehicleBody("JTNB11HK0M3000002", "30A-9", "NEW", 0).replace("\"versionId\":1", "\"versionId\":999");
        JsonNode res = call(post("/api/v1/admin/vehicles").content(body), 400);
        assertThat(res.path("message").asText()).isEqualTo("Phiên bản xe không tồn tại");
    }

    @Test
    void carServiceDownReturns503() throws Exception {
        when(cars.findVersion(1L)).thenThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Không kết nối được Car Service"));
        call(post("/api/v1/admin/vehicles").content(vehicleBody("JTNB11HK0M3000003", "30A-3", "NEW", 0)), 503);
    }

    // ------------------------------------------------------ đổi trạng thái

    @Test
    void changeStatusWritesHistoryWithChangedBy() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        call(patch("/api/v1/admin/vehicles/" + id + "/status")
                .content("{\"status\":\"MAINTENANCE\",\"reason\":\"Bảo dưỡng\"}"), 200);

        List<VehicleStatusHistory> h = history.findByVehicleIdOrderByCreatedAtDescIdDesc(id);
        assertThat(h).hasSize(2);
        VehicleStatusHistory latest = h.stream().max(java.util.Comparator.comparing(VehicleStatusHistory::getId)).get();
        assertThat(latest.getOldStatus()).isEqualTo(VehicleStatus.AVAILABLE);
        assertThat(latest.getNewStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
        assertThat(latest.getReason()).isEqualTo("Bảo dưỡng");
        assertThat(vehicles.findById(id).orElseThrow().getStatus()).isEqualTo(VehicleStatus.MAINTENANCE);
    }

    @Test
    void soldVehicleCannotChangeStatusOrPrice() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        setStatus(id, VehicleStatus.SOLD);
        call(patch("/api/v1/admin/vehicles/" + id + "/status").content("{\"status\":\"AVAILABLE\"}"), 409);
        String body = vehicleBody("JTNB11HK0M3000001", "30A-1", "NEW", 0).replace("\"price\":1000000000", "\"price\":1")
                .replace("\"branchId\":" + hanoi.getId() + ",", "");
        call(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/admin/vehicles/" + id)
                .content(body), 409);
        call(delete("/api/v1/admin/vehicles/" + id), 409);
    }

    @Test
    void deleteReservedVehicleReturns409() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        setStatus(id, VehicleStatus.RESERVED);
        call(delete("/api/v1/admin/vehicles/" + id), 409);
    }

    @Test
    void deleteAvailableVehicleSucceeds() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        call(delete("/api/v1/admin/vehicles/" + id), 200);
        call(get("/api/v1/admin/vehicles/" + id), 404);
    }

    // ----------------------------------------------------------- khác

    @Test
    void changeBranchRecordsReasonAndBlocksDeletingBranchWithVehicles() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        call(patch("/api/v1/admin/vehicles/" + id + "/branch")
                .content("{\"branchId\":" + hcm.getId() + ",\"reason\":\"Điều chuyển\"}"), 200);
        assertThat(inventory.findByVehicleId(id).orElseThrow().getBranch().getId()).isEqualTo(hcm.getId());
        assertThat(inventory.findByVehicleId(id).orElseThrow().getQuantity()).isEqualTo(1);
        call(patch("/api/v1/admin/vehicles/" + id + "/branch").content("{\"branchId\":" + hcm.getId() + "}"), 400);
        call(delete("/api/v1/admin/branches/" + hcm.getId()), 409);
        call(delete("/api/v1/admin/branches/" + hanoi.getId()), 200);
    }

    @Test
    void listFiltersAndStats() throws Exception {
        createVehicle("JTNB11HK0M3000001", "30A-111.11");
        long second = createVehicle("JTNB11HK0M3000002", "30A-222.22");
        setStatus(second, VehicleStatus.MAINTENANCE);

        JsonNode items = call(get("/api/v1/admin/vehicles?q=222.22&status=MAINTENANCE"), 200).path("data");
        assertThat(items.path("totalItems").asLong()).isEqualTo(1);
        assertThat(items.path("items").get(0).path("name").asText()).isEqualTo("Toyota Camry 2.0Q");

        JsonNode stats = call(get("/api/v1/admin/stats/vehicles"), 200).path("data");
        assertThat(stats.path("total").asLong()).isEqualTo(2);
        assertThat(stats.path("byStatus").path("AVAILABLE").asLong()).isEqualTo(1);
        assertThat(stats.path("byStatus").path("MAINTENANCE").asLong()).isEqualTo(1);
        assertThat(stats.path("byStatus").path("SOLD").asLong()).isZero();
        assertThat(stats.path("byCondition").path("NEW").asLong()).isEqualTo(2);
        assertThat(stats.path("byBranch").get(0).path("count").asLong()).isEqualTo(2);
    }

    @Test
    void internalVehicleReturnsFlatInfoForAnyValidToken() throws Exception {
        long id = createVehicle("JTNB11HK0M3000001", "30A-1");
        mvc.perform(get("/api/v1/internal/vehicles/" + id).header("Authorization", "Bearer " + token("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.vin").value("JTNB11HK0M3000001"))
                .andExpect(jsonPath("$.data.name").value("Toyota Camry 2.0Q"))
                .andExpect(jsonPath("$.data.branchName").value("Showroom Hà Nội"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }

    @Test
    void adminApiWithoutTokenReturns401AndCustomerReturns403() throws Exception {
        mvc.perform(get("/api/v1/admin/vehicles")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/vehicles").header("Authorization", "Bearer " + token("CUSTOMER")))
                .andExpect(status().isForbidden());
    }
}
