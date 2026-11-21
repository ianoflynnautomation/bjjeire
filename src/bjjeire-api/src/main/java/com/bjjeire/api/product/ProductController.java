package com.bjjeire.api.product;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** BJJ Éire merch anyone can browse without an account (User Story 2). */
@Tag(name = "BJJ Éire merch")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.PRODUCT)
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(
            summary = "List published products",
            description = "Published products only, ordered by kind (RASHGUARD, SHORTS, T_SHIRT) then name. soldOut is"
                    + " true when no size can be bought. An empty catalogue is an empty page.")
    public ResponseEntity<PagedResponse<ProductSummaryDto>> listProducts(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(productService.getPublished(new PaginationRequest(page, pageSize), ApiRoutes.PRODUCT));
    }

    @GetMapping("/{slug}")
    @Operation(
            summary = "Get a published product by slug",
            description = "Description, photos and every size it comes in, with what can be bought of each. Stock and"
                    + " what is held in checkouts are never shown. A draft or hidden product answers 404.")
    public ResponseEntity<ProductDto> getProductBySlug(@PathVariable String slug) {
        return productService.getPublishedBySlug(slug).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }
}
