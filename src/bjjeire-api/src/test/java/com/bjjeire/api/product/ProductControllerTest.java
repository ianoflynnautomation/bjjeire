package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductTestData.createJson;
import static com.bjjeire.api.product.ProductTestData.size;
import static com.bjjeire.api.product.ProductTestData.sizes;
import static com.bjjeire.api.product.ProductTestData.updateJson;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.web.ApiExceptionHandler;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/** Request validation on the product routes (T037). Errors name PascalCase fields. */
@ExtendWith(MockitoExtension.class)
class ProductControllerTest {
    private static final String ID = "665624c1ad01ce465c6cf456";
    private static final String ADMIN = ApiRoutes.PRODUCT + "/admin";
    private static final String THREE_SIZES = sizes(size("S", 3), size("M", 4), size("L", 2));

    @Mock
    private ProductService productService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(
                        new ProductController(productService),
                        new ProductAdminController(productService),
                        new ProductPhotoController(productService))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    @Tag("#6013")
    void shouldReturnCreatedWithTheDraftAndItsLocation() throws Exception {
        given(productService.create(any())).willReturn(adminProduct());

        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content(createJson("harp", THREE_SIZES)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", ADMIN + "/" + ID))
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @Tag("#6002")
    void shouldReturnNotFoundWhenNoPublishedProductHasTheSlug() throws Exception {
        given(productService.getPublishedBySlug("nope")).willReturn(Optional.empty());

        mockMvc.perform(get(ApiRoutes.PRODUCT + "/nope"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:not-found"));
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "\"name\": \"Harp Rashguard\"|\"name\": \"\"|Name",
                "\"description\": \"Long sleeve, sublimated harp.\"|\"description\": \"\"|Description",
                "\"priceCents\": 4500|\"priceCents\": 99|PriceCents",
                "\"priceCents\": 4500|\"priceCents\": 100001|PriceCents",
                "\"slug\": \"harp\"|\"slug\": \"ab\"|Slug",
                "\"slug\": \"harp\"|\"slug\": \"Harp Rash\"|Slug",
                "\"slug\": \"harp\"|\"slug\": \"admin\"|Slug",
                "\"slug\": \"harp\"|\"slug\": \"photo\"|Slug",
                "\"kind\": \"RASHGUARD\"|\"kind\": null|Kind"
            })
    @Tag("#6013")
    void shouldRefuseAnInvalidFieldNamingIt(String original, String replacement, String field) throws Exception {
        String body = createJson("harp", THREE_SIZES).replace(original, replacement);
        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:validation-error"))
                .andExpect(jsonPath("$.errors[0].field").value(field));
        then(productService).should(never()).create(any());
    }

    @Test
    @Tag("#6013")
    void shouldRefuseANameOrDescriptionOverItsLimit() throws Exception {
        String longName = createJson("harp", THREE_SIZES).replace("Harp Rashguard", "n".repeat(81));
        String longDescription =
                createJson("harp", THREE_SIZES).replace("Long sleeve, sublimated harp.", "d".repeat(2001));

        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content(longName))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Name"));
        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content(longDescription))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Description"));
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAProductWithNoSizeOrNegativeStock() throws Exception {
        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content(createJson("harp", "[]")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Sizes"));
        mockMvc.perform(post(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson("harp", sizes(size("M", -1)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Sizes[0].Stock"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"id\":\"XXXL\",\"stock\":1}", "{\"id\":\"m\",\"stock\":1}"})
    @Tag("#6013")
    void shouldRefuseASizeThatIsNotXsToXxl(String unknownSize) throws Exception {
        mockMvc.perform(post(ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createJson("harp", "[" + unknownSize + "]")))
                .andExpect(status().isBadRequest());
        then(productService).should(never()).create(any());
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAnUpdateWithoutAVersion() throws Exception {
        String body = updateJson("harp", 4500, THREE_SIZES, "[]", 0).replace(",\n  \"version\": 0", "");

        mockMvc.perform(put(ADMIN + "/" + ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Version"));
        then(productService).should(never()).update(anyString(), any());
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAPhotoThatIsNotAHash() throws Exception {
        mockMvc.perform(put(ADMIN + "/" + ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson("harp", 4500, THREE_SIZES, "[\"../etc\"]", 0)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("Photos[0]"));
    }

    @Test
    @Tag("#6013")
    void shouldRefuseABodyThatIsNotJson() throws Exception {
        mockMvc.perform(post(ADMIN).contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:bjjeire:bad-request"));
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAnIdThatIsNotAnObjectId() throws Exception {
        mockMvc.perform(post(ADMIN + "/not-an-id/publish")).andExpect(status().isBadRequest());
        then(productService).should(never()).publish(anyString());
    }

    private static AdminProductDto adminProduct() {
        return new AdminProductDto(
                ID,
                "harp",
                "Harp Rashguard",
                ProductKind.RASHGUARD,
                "Long sleeve, sublimated harp.",
                4500,
                "EUR",
                List.of(),
                List.of(new AdminProductSizeDto(SizeId.M, 4, 0, 4, false)),
                ProductStatus.DRAFT,
                0L,
                Instant.parse("2026-05-31T00:00:00Z"),
                null);
    }
}
