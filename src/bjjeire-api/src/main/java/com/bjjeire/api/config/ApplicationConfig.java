package com.bjjeire.api.config;

import java.time.Clock;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import tools.jackson.databind.ext.javatime.deser.LocalTimeDeserializer;
import tools.jackson.databind.ext.javatime.ser.LocalTimeSerializer;
import tools.jackson.databind.module.SimpleModule;

@Configuration
@EnableScheduling
public class ApplicationConfig {
    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    JsonMapperBuilderCustomizer localTimeJsonCustomizer() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(LocalTime.class, new LocalTimeSerializer(DateTimeFormatter.ofPattern("HH:mm:ss")));
        module.addDeserializer(LocalTime.class, new LocalTimeDeserializer(DateTimeFormatter.ofPattern("HH:mm[:ss]")));
        return builder -> builder.addModule(module);
    }
}
