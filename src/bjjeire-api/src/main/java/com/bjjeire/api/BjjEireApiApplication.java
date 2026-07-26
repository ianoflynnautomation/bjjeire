package com.bjjeire.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Profiles;

@SpringBootApplication
@ConfigurationPropertiesScan
@SuppressWarnings("checkstyle:HideUtilityClassConstructor")
public class BjjEireApiApplication {
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(BjjEireApiApplication.class, args);

        if (context.getEnvironment().acceptsProfiles(Profiles.of("seeder"))) {
            System.exit(SpringApplication.exit(context));
        }
    }
}
