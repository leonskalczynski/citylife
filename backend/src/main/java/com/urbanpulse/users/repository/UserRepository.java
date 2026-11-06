package com.urbanpulse.users.repository;

import com.urbanpulse.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findAllByRoleAndEnabledTrueOrderByDisplayNameAsc(com.urbanpulse.users.model.Role role);
}

