package com.citylife.incidents.controller;

import com.citylife.incidents.dto.CreateIncidentRequest;
import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.dto.IncidentStatusChangeResponse;
import com.citylife.incidents.service.IncidentAuditService;
import com.citylife.incidents.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/incidents")
@PreAuthorize("hasRole('CITIZEN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Citizen incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final IncidentAuditService auditService;

    public IncidentController(IncidentService incidentService, IncidentAuditService auditService) {
        this.incidentService = incidentService;
        this.auditService = auditService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Reports a new incident")
    public IncidentResponse create(
            Authentication authentication,
            @Valid @RequestBody CreateIncidentRequest request
    ) {
        return incidentService.create(authentication.getName(), request);
    }

    @GetMapping("/my")
    @Operation(summary = "Lists incidents reported by the authenticated citizen")
    public List<IncidentResponse> listMine(Authentication authentication) {
        return incidentService.listMine(authentication.getName());
    }

    @GetMapping("/{incidentId}")
    @Operation(summary = "Returns one incident owned by the authenticated citizen")
    public IncidentResponse getMine(Authentication authentication, @PathVariable UUID incidentId) {
        return incidentService.getMine(authentication.getName(), incidentId);
    }

    @GetMapping("/{incidentId}/history")
    @Operation(summary = "Returns the visible status history of an owned incident")
    public List<IncidentStatusChangeResponse> getHistory(Authentication authentication, @PathVariable UUID incidentId) {
        return auditService.listForCitizen(incidentId, authentication.getName());
    }
}
