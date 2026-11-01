package com.citylife.auth.config;

import com.citylife.users.model.Role;
import com.citylife.users.model.User;
import com.citylife.users.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
@Order(1)
public class DemoUserInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String demoPassword;

    public DemoUserInitializer(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo.password}") String demoPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.demoPassword = demoPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        createIfMissing("citizen@example.com", "Demo Citizen", Role.CITIZEN);
        createIfMissing("operator@example.com", "Demo Operator", Role.OPERATOR);
        createIfMissing("technician@example.com", "Demo Technician", Role.TECHNICIAN);
        createIfMissing("admin@example.com", "Demo Admin", Role.ADMIN);
    }

    private void createIfMissing(String email, String displayName, Role role) {
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            userRepository.save(new User(email, passwordEncoder.encode(demoPassword), displayName, role));
        }
    }
}

