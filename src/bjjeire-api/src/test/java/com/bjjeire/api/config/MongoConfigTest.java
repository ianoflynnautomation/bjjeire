package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.gym.ClassCategory;
import com.mongodb.MongoClientSettings;
import org.bson.UuidRepresentation;
import org.junit.jupiter.api.Test;

class MongoConfigTest {
    @Test
    void shouldEncodeUuidsAsStandardSoTheEventRegistryCanStoreItsIds() {
        MongoClientSettings.Builder builder = MongoClientSettings.builder();

        new MongoConfig().mongoClientTimeouts().customize(builder);

        assertThat(builder.build().getUuidRepresentation()).isEqualTo(UuidRepresentation.STANDARD);
    }

    @Test
    void integerClassCategoryReadConverterUsesStoredEnumValues() {
        MongoConfig.IntegerClassCategoryReadConverter converter = new MongoConfig.IntegerClassCategoryReadConverter();

        assertThat(converter.convert(1)).isEqualTo(ClassCategory.BJJGiAllLevels);
        assertThat(converter.convert(10)).isEqualTo(ClassCategory.BJJGiFundamentals);
        assertThat(converter.convert(99)).isEqualTo(ClassCategory.Other);
    }

    @Test
    void classCategoryWriteConverterUsesStoredEnumValues() {
        MongoConfig.ClassCategoryWriteConverter converter = new MongoConfig.ClassCategoryWriteConverter();

        assertThat(converter.convert(ClassCategory.BJJGiAllLevels)).isEqualTo(1);
        assertThat(converter.convert(ClassCategory.BJJGiFundamentals)).isEqualTo(10);
        assertThat(converter.convert(ClassCategory.Other)).isEqualTo(99);
    }

    @Test
    void stringClassCategoryReadConverterSupportsNewStringDocuments() {
        MongoConfig.StringClassCategoryReadConverter converter = new MongoConfig.StringClassCategoryReadConverter();

        assertThat(converter.convert("KidsBJJ")).isEqualTo(ClassCategory.KidsBJJ);
        assertThat(converter.convert("Unknown")).isEqualTo(ClassCategory.Other);
    }
}
