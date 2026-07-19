package com.bjjeire.api.config;

import com.fasterxml.jackson.datatype.jsr310.deser.LocalTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalTimeSerializer;
import java.time.Clock;
import java.time.format.DateTimeFormatter;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class ApplicationConfig {
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    Jackson2ObjectMapperBuilderCustomizer localTimeJsonCustomizer() {
        return builder -> builder.serializers(new LocalTimeSerializer(DateTimeFormatter.ofPattern("HH:mm:ss")))
                .deserializers(new LocalTimeDeserializer(DateTimeFormatter.ofPattern("HH:mm[:ss]")));
    }
}
