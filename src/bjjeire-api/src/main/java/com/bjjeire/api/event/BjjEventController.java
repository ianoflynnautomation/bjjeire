package com.bjjeire.api.event;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.ValidObjectId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Bjj Events")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.BJJ_EVENT)
public class BjjEventController {

    private final BjjEventService bjjEventService;

    @GetMapping
    @Operation(summary = "List BJJ events")
    public ResponseEntity<PagedResponse<BjjEventDto>> getAll(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) County county,
            @RequestParam(required = false) List<BjjEventType> types,
            @RequestParam(defaultValue = "false") boolean includeInactive) {

        var response = bjjEventService.getAll(
                new PaginationRequest(page, pageSize), county, types, includeInactive, ApiRoutes.BJJ_EVENT);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get BJJ event by ID")
    public ResponseEntity<BjjEventDto> getById(@PathVariable @ValidObjectId String id) {
        return bjjEventService
                .getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new BJJ event")
    public ResponseEntity<CreateBjjEventResponse> create(@RequestBody @Valid CreateBjjEventCommand command) {
        CreateBjjEventResponse response = bjjEventService.create(command);
        URI location = URI.create(ApiRoutes.BJJ_EVENT + "/" + response.data().id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update BJJ event")
    public ResponseEntity<UpdateBjjEventResponse> update(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid UpdateBjjEventCommand command) {

        if (command.data().id() != null && !id.equals(command.data().id())) {
            return ResponseEntity.badRequest().build();
        }

        return bjjEventService
                .update(id, command)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete BJJ event")
    public ResponseEntity<Void> delete(@PathVariable @ValidObjectId String id) {
        boolean deleted = bjjEventService.delete(id);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
