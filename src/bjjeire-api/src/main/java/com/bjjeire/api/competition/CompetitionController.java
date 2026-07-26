package com.bjjeire.api.competition;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Competitions")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.COMPETITION)
public class CompetitionController {

    private final CompetitionService competitionService;

    @GetMapping
    @Operation(summary = "List all competitions with pagination")
    public ResponseEntity<PagedResponse<CompetitionDto>> getAll(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(defaultValue = "false") boolean includeInactive) {

        PagedResponse<CompetitionDto> response = competitionService.getAll(
                new PaginationRequest(page, pageSize), includeInactive, ApiRoutes.COMPETITION);

        return ResponseEntity.ok(response);
    }
}
