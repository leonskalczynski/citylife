package com.citylife.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfiguration {

    @Bean
    OpenAPI citylifeOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Citylife API")
                .version("0.1.0")
                .description("API REST para la gestión de incidencias urbanas"));
    }
}

