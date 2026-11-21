package com.bjjeire.api.product;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * The organiser's product admin (User Story 4). Every route needs the writer scope; {@code SecurityConfig} enforces it.
 */
@Tag(name = "BJJ Éire merch administration")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ProductAdminController.ADMIN)
public class ProductAdminController {
    static final String ADMIN = ApiRoutes.PRODUCT + "/admin";

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "List every product, drafts and hidden ones included, with stock and holds per size")
    public ResponseEntity<PagedResponse<AdminProductDto>> listProductsForAdmin(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(productService.getAllForAdmin(new PaginationRequest(page, pageSize), ADMIN));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a product in any status by id")
    public ResponseEntity<AdminProductDto> getProductForAdmin(@PathVariable @ValidObjectId String id) {
        return productService.getForAdmin(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping
    @Operation(
            summary = "Create a product as a draft",
            description = "Visitors cannot see a draft. Add photos with the photo route, then publish. Not safe to"
                    + " retry: the slug is unique, so the same request again returns 409.")
    public ResponseEntity<AdminProductDto> createProduct(@RequestBody @Valid CreateProductCommand command) {
        AdminProductDto created = productService.create(command);
        return ResponseEntity.created(URI.create(ADMIN + "/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update a product",
            description = "Replaces the details, the full size list and the photo order. A size or photo left out is"
                    + " removed; removing a size that checkouts hold is 409 size-has-holds, and stock below what is"
                    + " held is 409 stock-below-held. A price change applies to new checkouts only. Send the version"
                    + " from the last read; a missing version is 400, and a stale one is 409: reload and retry.")
    public ResponseEntity<AdminProductDto> updateProduct(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid UpdateProductCommand command) {
        return productService.update(id, command).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/publish")
    @Operation(
            summary = "Show a draft or hidden product to visitors",
            description = "Needs 1 to 6 photos and at least one size, or answers 409 product-not-publishable."
                    + " Publishing a published product returns it unchanged.")
    public ResponseEntity<AdminProductDto> publishProduct(@PathVariable @ValidObjectId String id) {
        return productService.publish(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/hide")
    @Operation(
            summary = "Take a published product off sale",
            description = "Visitors no longer see or buy it; orders already placed are unchanged. A draft is 409.")
    public ResponseEntity<AdminProductDto> hideProduct(@PathVariable @ValidObjectId String id) {
        return productService.hide(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PutMapping("/{id}/stock")
    @Operation(
            summary = "Set the stock of some sizes",
            description = "Sizes left out keep their stock. Stock below what checkouts hold is 409 stock-below-held."
                    + " A stale version is 409.")
    public ResponseEntity<AdminProductDto> setProductStock(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid StockCommand command) {
        return productService.setStock(id, command).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping(path = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Add a photo to the end of a product's photos",
            description = "Part \"file\": a JPEG, PNG or WebP of at most 5 MB, checked by its first bytes (415"
                    + " unsupported-image otherwise). A seventh photo is 409 too-many-photos. The same bytes again"
                    + " return the same hash and add nothing.")
    public ResponseEntity<PhotoUploadResponse> addProductPhoto(
            @PathVariable @ValidObjectId String id, @RequestPart("file") MultipartFile file) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException unreadable) {
            throw new UncheckedIOException(unreadable);
        }
        String sha256 = productService.addPhoto(id, content).orElseThrow(ApiProblems::notFound);
        return ResponseEntity.status(HttpStatus.CREATED).body(new PhotoUploadResponse(sha256));
    }

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Delete a draft",
            description = "Only a draft can be deleted (409 product-not-draft otherwise); hide a product to take it off"
                    + " sale. A second delete is 404.")
    public ResponseEntity<Void> deleteProduct(@PathVariable @ValidObjectId String id) {
        if (!productService.delete(id)) {
            throw ApiProblems.notFound();
        }
        return ResponseEntity.noContent().build();
    }
}
