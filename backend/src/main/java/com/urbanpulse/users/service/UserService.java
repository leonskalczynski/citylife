package com.urbanpulse.users.service;

import com.urbanpulse.shared.error.ResourceNotFoundException;
import com.urbanpulse.users.dto.CurrentUserResponse;
import com.urbanpulse.users.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public CurrentUserResponse getByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .map(CurrentUserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("USER_NOT_FOUND", "Usuario no encontrado"));
    }
}

