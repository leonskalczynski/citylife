package com.urbanpulse.system;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@Tag(name = "System", description = "Estado de la API para desarrollo e integración")
public class SystemController {

    @GetMapping("/status")
    @Operation(summary = "Comprueba que la API está disponible")
    public SystemStatusResponse getStatus() {
        return new SystemStatusResponse("Urban Pulse", "UP");
    }
}

