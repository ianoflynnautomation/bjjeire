package com.bjjeire.api.config;

import com.bjjeire.api.gym.ClassCategory;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.bson.types.Decimal128;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoConfig {
    // Existing documents store decimals as Decimal128 and times as "HH:mm:ss" strings;
    // these converters keep documents interchangeable between both APIs.
    private static final DateTimeFormatter TIME_WRITE_FORMAT = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter TIME_READ_FORMAT = DateTimeFormatter.ofPattern("HH:mm[:ss]");

    @Bean
    MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new IntegerClassCategoryReadConverter(),
                new LongClassCategoryReadConverter(),
                new StringClassCategoryReadConverter(),
                new ClassCategoryWriteConverter(),
                new BigDecimalWriteConverter(),
                new Decimal128BigDecimalReadConverter(),
                new StringBigDecimalReadConverter(),
                new DoubleBigDecimalReadConverter(),
                new LocalTimeWriteConverter(),
                new StringLocalTimeReadConverter()));
    }

    @ReadingConverter
    public static class IntegerClassCategoryReadConverter implements Converter<Integer, ClassCategory> {
        @Override
        public ClassCategory convert(Integer source) {
            return ClassCategory.fromStoredValue(source);
        }
    }

    @ReadingConverter
    public static class LongClassCategoryReadConverter implements Converter<Long, ClassCategory> {
        @Override
        public ClassCategory convert(Long source) {
            return ClassCategory.fromStoredValue(source.intValue());
        }
    }

    @ReadingConverter
    public static class StringClassCategoryReadConverter implements Converter<String, ClassCategory> {
        @Override
        public ClassCategory convert(String source) {
            try {
                return ClassCategory.valueOf(source);
            } catch (IllegalArgumentException exception) {
                return ClassCategory.Other;
            }
        }
    }

    @WritingConverter
    public static class ClassCategoryWriteConverter implements Converter<ClassCategory, Integer> {
        @Override
        public Integer convert(ClassCategory source) {
            return source.storedValue();
        }
    }

    @WritingConverter
    public static class BigDecimalWriteConverter implements Converter<BigDecimal, Decimal128> {
        @Override
        public Decimal128 convert(BigDecimal source) {
            return new Decimal128(source);
        }
    }

    @ReadingConverter
    public static class Decimal128BigDecimalReadConverter implements Converter<Decimal128, BigDecimal> {
        @Override
        public BigDecimal convert(Decimal128 source) {
            return source.bigDecimalValue();
        }
    }

    @ReadingConverter
    public static class StringBigDecimalReadConverter implements Converter<String, BigDecimal> {
        @Override
        public BigDecimal convert(String source) {
            return new BigDecimal(source);
        }
    }

    @ReadingConverter
    public static class DoubleBigDecimalReadConverter implements Converter<Double, BigDecimal> {
        @Override
        public BigDecimal convert(Double source) {
            return BigDecimal.valueOf(source);
        }
    }

    @WritingConverter
    public static class LocalTimeWriteConverter implements Converter<LocalTime, String> {
        @Override
        public String convert(LocalTime source) {
            return source.format(TIME_WRITE_FORMAT);
        }
    }

    @ReadingConverter
    public static class StringLocalTimeReadConverter implements Converter<String, LocalTime> {
        @Override
        public LocalTime convert(String source) {
            return LocalTime.parse(source, TIME_READ_FORMAT);
        }
    }
}
