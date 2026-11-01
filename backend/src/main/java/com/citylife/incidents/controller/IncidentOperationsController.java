package com.citylife.incidents.controller;

import com.citylife.incidents.dto.AssignIncidentRequest;
import com.citylife.incidents.dto.ChangePriorityRequest;
import com.citylife.incidents.dto.IncidentResponse;
import com.citylife.incidents.dto.PageResponse;
import com.citylife.incidents.dto.RejectIncidentRequest;
import com.citylife.incidents.model.IncidentStatus;
import com.citylife.incidents.model.Priority;
import com.citylife.incidents.service.IncidentOperationsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/operations/incidents")
@PreAuthorize("hasRole('OPERATOR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Incident operations")
public class IncidentOperationsController {

    private final IncidentOperationsService operationsService;

    public IncidentOperationsController(IncidentOperationsService operationsService) {
        this.operationsService = operationsService;
    }

    @GetMapping
    @Operation(summary = "Searches incidents with server-side pagination and filters")
    public PageResponse<IncidentResponse> search(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return operationsService.search(status, priority, categoryId, departmentId, district, search, page, size);
    }

    @GetMapping("/{incidentId}")
    @Operation(summary = "Returns an incident for operational review")
    public IncidentResponse get(@PathVariable UUID incidentId) {
        return operationsService.get(incidentId);
    }

    @PostMapping("/{incidentId}/validate")
    @Operation(summary = "Validates a reported incident")
    public IncidentResponse validate(@PathVariable UUID incidentId) {
        return operationsService.validate(incidentId);
    }

    @PostMapping("/{incidentId}/reject")
    @Operation(summary = "Rejects a reported incident with a reason")
    public IncidentResponse reject(@PathVariable UUID incidentId, @Valid @RequestBody RejectIncidentRequest request) {
        return operationsService.reject(incidentId, request);
    }

    @PostMapping("/{incidentId}/priority")
    @Operation(summary = "Changes incident priority")
    public IncidentResponse changePriority(@PathVariable UUID incidentId, @Valid @RequestBody ChangePriorityRequest request) {
        return operationsService.changePriority(incidentId, request);
    }

    @PostMapping("/{incidentId}/assign")
    @Operation(summary = "Assigns an incident to a department and optional technician")
    public IncidentResponse assign(@PathVariable UUID incidentId, @Valid @RequestBody AssignIncidentRequest request) {
        return operationsService.assign(incidentId, request);
    }
}
