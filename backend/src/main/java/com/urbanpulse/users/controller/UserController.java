package com.urbanpulse.users.controller;

import com.urbanpulse.users.dto.CurrentUserResponse;
import com.urbanpulse.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Returns the authenticated user", security = @SecurityRequirement(name = "bearerAuth"))
    public CurrentUserResponse getCurrentUser(Authentication authentication) {
        return userService.getByEmail(authentication.getName());
    }
}

