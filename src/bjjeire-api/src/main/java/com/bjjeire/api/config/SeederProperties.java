package com.bjjeire.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

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
