package com.bjjeire.api.gym;

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

@Tag(name = "Gyms")
@RestController
@RequiredArgsConstructor
@RequestMapping({ApiRoutes.GYM, ApiRoutes.GYM_LOWERCASE})
public class GymController {

    private final GymService gymService;

    @GetMapping
    @Operation(summary = "List gyms with pagination and filters")
    public ResponseEntity<PagedResponse<GymDto>> getAll(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(required = false) County county) {

        PagedResponse<GymDto> response =
                gymService.getAll(new PaginationRequest(page, pageSize), county, ApiRoutes.GYM);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get gym by ID")
    public ResponseEntity<GymDto> getById(@PathVariable @ValidObjectId String id) {
        return gymService
                .getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new gym")
    public ResponseEntity<CreateGymResponse> create(@RequestBody @Valid CreateGymCommand command) {
        CreateGymResponse response = gymService.create(command);

        URI location = URI.create(ApiRoutes.GYM + "/" + response.data().id());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update gym")
    public ResponseEntity<UpdateGymResponse> update(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid UpdateGymCommand command) {

        if (command.data().id() != null && !id.equals(command.data().id())) {
            return ResponseEntity.badRequest().build();
        }

        return gymService
                .update(id, command)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete gym")
    public ResponseEntity<Void> delete(@PathVariable @ValidObjectId String id) {
        boolean deleted = gymService.delete(id);
        return deleted
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
