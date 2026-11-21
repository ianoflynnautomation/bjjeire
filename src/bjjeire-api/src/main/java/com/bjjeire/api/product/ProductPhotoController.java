package com.bjjeire.api.product;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Product photos by content address (research R4). The address is the hash of the bytes, so a photo never changes and
 * may be cached for a year. The type comes from the upload's magic-number check, never from the client.
 */
@Tag(name = "BJJ Éire merch")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.PRODUCT + "/photo")
public class ProductPhotoController {
    private static final String SHA256 = "[0-9a-f]{64}";

    private final ProductService productService;

    @GetMapping("/{sha256:" + SHA256 + "}")
    @Operation(summary = "Get a product photo", description = "JPEG, PNG or WebP. An unknown hash answers 404.")
    public ResponseEntity<byte[]> getPhoto(@PathVariable String sha256) {
        ProductPhoto photo = productService.getPhoto(sha256).orElseThrow(ApiProblems::notFound);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .cacheControl(
                        CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .body(photo.content());
    }
}
