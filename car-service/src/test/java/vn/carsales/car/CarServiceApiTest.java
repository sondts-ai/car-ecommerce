package vn.carsales.car;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.carsales.car.repository.CarImageRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CarServiceApiTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123456";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired CarImageRepository imageRepository;

    private String token(String role) {
        return Jwts.builder().issuer("car-sales-auth").claim("userId", 7).claim("role", role)
                .expiration(new Date(System.currentTimeMillis() + 3_600_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private MockHttpServletRequestBuilder admin(MockHttpServletRequestBuilder b) {
        return b.header("Authorization", "Bearer " + token("ADMIN")).contentType(MediaType.APPLICATION_JSON);
    }

    private JsonNode call(MockHttpServletRequestBuilder b, int expectedStatus) throws Exception {
        String body = mvc.perform(admin(b)).andExpect(status().is(expectedStatus)).andReturn()
                .getResponse().getContentAsString(StandardCharsets.UTF_8);
        return json.readTree(body);
    }

    private long createBrand(String name) throws Exception {
        return call(post("/api/v1/admin/brands").content("{\"name\":\"" + name + "\"}"), 201)
                .path("data").path("id").asLong();
    }

    private long createModel(long brandId, String name) throws Exception {
        return call(post("/api/v1/admin/car-models")
                .content("{\"brandId\":" + brandId + ",\"name\":\"" + name + "\"}"), 201)
                .path("data").path("id").asLong();
    }

    private long addImage(long modelId, String url, boolean thumb) throws Exception {
        return call(post("/api/v1/admin/car-models/" + modelId + "/images")
                .content("{\"imageUrl\":\"" + url + "\",\"isThumbnail\":" + thumb + ",\"sortOrder\":1}"), 201)
                .path("data").path("id").asLong();
    }

    @Test
    void duplicateBrandNameReturns409() throws Exception {
        createBrand("Toyota");
        JsonNode res = call(post("/api/v1/admin/brands").content("{\"name\":\"toyota\"}"), 409);
        assertThat(res.path("success").asBoolean()).isFalse();
        assertThat(res.path("message").asText()).isEqualTo("Tên hãng đã tồn tại");
    }

    @Test
    void blankBrandNameReturns400() throws Exception {
        JsonNode res = call(post("/api/v1/admin/brands").content("{\"name\":\" \"}"), 400);
        assertThat(res.path("success").asBoolean()).isFalse();
    }

    @Test
    void deleteBrandWithModelsReturns409() throws Exception {
        long brandId = createBrand("Honda");
        createModel(brandId, "CR-V");
        call(delete("/api/v1/admin/brands/" + brandId), 409);
        call(get("/api/v1/admin/brands/" + brandId), 200);
    }

    @Test
    void deleteBrandWithoutModelsSucceeds() throws Exception {
        long brandId = createBrand("VinFast");
        call(delete("/api/v1/admin/brands/" + brandId), 200);
        call(get("/api/v1/admin/brands/" + brandId), 404);
    }

    @Test
    void deleteModelWithVersionsReturns409() throws Exception {
        long modelId = createModel(createBrand("Mazda"), "CX-5");
        call(post("/api/v1/admin/car-models/" + modelId + "/versions")
                .content("{\"versionName\":\"2.0 Luxury\",\"transmission\":\"AUTO\",\"fuelType\":\"GASOLINE\",\"seats\":5}"), 201);
        call(delete("/api/v1/admin/car-models/" + modelId), 409);
    }

    @Test
    void versionSeatsOutOfRangeReturns400() throws Exception {
        long modelId = createModel(createBrand("Kia"), "Seltos");
        call(post("/api/v1/admin/car-models/" + modelId + "/versions")
                .content("{\"versionName\":\"X\",\"seats\":1}"), 400);
    }

    @Test
    void settingNewThumbnailClearsOldOne() throws Exception {
        long modelId = createModel(createBrand("Toyota"), "Camry");
        long first = addImage(modelId, "http://img/1.jpg", true);
        long second = addImage(modelId, "http://img/2.jpg", false);

        call(patch("/api/v1/admin/car-images/" + second + "/thumbnail"), 200);

        var all = imageRepository.findByModelIdOrderBySortOrderAscIdAsc(modelId);
        assertThat(all).filteredOn(i -> i.isThumbnail()).extracting(i -> i.getId()).containsExactly(second);
        assertThat(all).filteredOn(i -> i.getId().equals(first)).extracting(i -> i.isThumbnail())
                .containsExactly(false);
    }

    @Test
    void addingThumbnailImageClearsOldOne() throws Exception {
        long modelId = createModel(createBrand("Toyota"), "Vios");
        addImage(modelId, "http://img/1.jpg", true);
        long second = addImage(modelId, "http://img/2.jpg", true);
        var thumbs = imageRepository.findByModelIdOrderBySortOrderAscIdAsc(modelId).stream()
                .filter(i -> i.isThumbnail()).toList();
        assertThat(thumbs).hasSize(1);
        assertThat(thumbs.get(0).getId()).isEqualTo(second);
    }

    @Test
    void modelListIncludesBrandCategoriesAndThumbnail() throws Exception {
        long brandId = createBrand("Toyota");
        long catId = call(post("/api/v1/admin/categories").content("{\"name\":\"Sedan\"}"), 201)
                .path("data").path("id").asLong();
        long modelId = call(post("/api/v1/admin/car-models").content(
                "{\"brandId\":" + brandId + ",\"name\":\"Camry\",\"categoryIds\":[" + catId + "]}"), 201)
                .path("data").path("id").asLong();
        addImage(modelId, "http://img/thumb.jpg", true);

        JsonNode item = call(get("/api/v1/admin/car-models?categoryId=" + catId + "&q=cam"), 200)
                .path("data").path("items").get(0);
        assertThat(item.path("brandName").asText()).isEqualTo("Toyota");
        assertThat(item.path("categories").get(0).path("name").asText()).isEqualTo("Sedan");
        assertThat(item.path("thumbnailUrl").asText()).isEqualTo("http://img/thumb.jpg");
    }

    @Test
    void internalVersionReturnsFlatInfo() throws Exception {
        long modelId = createModel(createBrand("Honda"), "Civic");
        long versionId = call(post("/api/v1/admin/car-models/" + modelId + "/versions")
                .content("{\"versionName\":\"RS\",\"transmission\":\"CVT\",\"fuelType\":\"GASOLINE\",\"seats\":5}"), 201)
                .path("data").path("id").asLong();

        // token CUSTOMER cũng được gọi API nội bộ
        mvc.perform(get("/api/v1/internal/versions/" + versionId).header("Authorization", "Bearer " + token("CUSTOMER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.versionName").value("RS"))
                .andExpect(jsonPath("$.data.modelName").value("Civic"))
                .andExpect(jsonPath("$.data.brandName").value("Honda"))
                .andExpect(jsonPath("$.data.transmission").value("CVT"));
        mvc.perform(get("/api/v1/internal/versions/999999").header("Authorization", "Bearer " + token("ADMIN")))
                .andExpect(status().isNotFound());
    }

    @Test
    void adminApiWithoutTokenReturns401() throws Exception {
        mvc.perform(get("/api/v1/admin/brands")).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
        mvc.perform(get("/api/v1/admin/brands").header("Authorization", "Bearer rac.rac.rac"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminApiWithCustomerTokenReturns403() throws Exception {
        mvc.perform(get("/api/v1/admin/brands").header("Authorization", "Bearer " + token("CUSTOMER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void swaggerIsPublic() throws Exception {
        mvc.perform(get("/v3/api-docs")).andExpect(status().isOk());
    }
}
