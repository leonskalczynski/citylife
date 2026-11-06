package com.urbanpulse.users.controller;

import com.urbanpulse.users.dto.UserSummaryResponse;
import com.urbanpulse.users.model.Role;
import com.urbanpulse.users.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/technicians")
@PreAuthorize("hasRole('OPERATOR')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Technicians")
public class TechnicianController {

    private final UserRepository userRepository;

    public TechnicianController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Lists enabled technicians available for assignment")
    public List<UserSummaryResponse> list() {
        return userRepository.findAllByRoleAndEnabledTrueOrderByDisplayNameAsc(Role.TECHNICIAN).stream()
                .map(UserSummaryResponse::from)
                .toList();
    }
}
