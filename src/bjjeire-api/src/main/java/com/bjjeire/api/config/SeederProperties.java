package com.bjjeire.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// dataRoot points at the directory holding data/ (and optionally data-test/);
// it defaults to the repo-root seeder/ directory. dataset=test additionally loads the
// data-test/ fixtures (selected via the SEED_DATASET variable).
@ConfigurationProperties(prefix = "bjjeire.seeder")
public record SeederProperties(String dataRoot, String dataset) {
    public SeederProperties {
        dataRoot = dataRoot == null || dataRoot.isBlank() ? "../../seeder" : dataRoot;
        dataset = dataset == null ? "" : dataset;
    }

    public boolean useTestDataset() {
        return "test".equalsIgnoreCase(dataset);
    }
}
