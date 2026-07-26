package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.config.BjjEireProperties;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.FEATURE_FLAG)
public class FeatureFlagController {
    private static final List<String> FRONTEND_FLAGS = List.of("BjjEvents", "Gyms", "Competitions", "Stores");

    private final BjjEireProperties properties;

    @GetMapping
    public ResponseEntity<Map<String, Boolean>> get() {
        Map<String, Boolean> flags = new LinkedHashMap<>(FRONTEND_FLAGS.size());
        FRONTEND_FLAGS.forEach(name -> flags.put(name, properties.isFeatureEnabled(name)));

        return ResponseEntity.ok(flags);
    }
}
