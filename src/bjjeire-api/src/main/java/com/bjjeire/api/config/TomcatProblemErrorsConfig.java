package com.bjjeire.api.config;

import org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.ObjectMapper;

/**
 * Puts {@link ProblemErrorReportValve} on the Tomcat host. It is added after Spring Boot's own error report valve, so
 * it sits later in the pipeline, reports first, and marks the error reported; the HTML valve then writes nothing.
 */
@Configuration
public class TomcatProblemErrorsConfig {
    @Bean
    WebServerFactoryCustomizer<TomcatServletWebServerFactory> problemErrorReportValve(ObjectMapper objectMapper) {
        return factory -> factory.addContextCustomizers(
                context -> context.getParent().getPipeline().addValve(new ProblemErrorReportValve(objectMapper)));
    }
}
