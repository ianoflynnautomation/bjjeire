package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Serves the anonymous catalogue snapshot. This route does not accept a caller identity. */
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.FEATURE_FLAG)
public class FeatureFlagController {
    private final FeatureFlagService featureFlags;

    /**
     * Returns every catalogue flag.
     *
     * @return wire name to boolean, evaluated anonymously
     */
    @GetMapping
    public ResponseEntity<Map<String, Boolean>> get() {
        return ResponseEntity.ok(featureFlags.frontendFlags());
    }
}
