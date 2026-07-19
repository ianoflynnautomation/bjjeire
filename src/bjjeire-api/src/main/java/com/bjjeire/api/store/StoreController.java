package com.bjjeire.api.store;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping({ApiRoutes.STORE, ApiRoutes.STORE_LOWERCASE})
public class StoreController {
    private final StoreService storeService;

    @GetMapping
    public ResponseEntity<PagedResponse<StoreDto>> getAll(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        PagedResponse<StoreDto> response = storeService.getAll(new PaginationRequest(page, pageSize), ApiRoutes.STORE);

        return ResponseEntity.ok(response);
    }
}
