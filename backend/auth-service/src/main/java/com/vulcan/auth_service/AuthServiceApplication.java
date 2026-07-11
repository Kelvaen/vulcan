package com.vulcan.auth_service;

import com.vulcan.auth_service.entity.Role;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class AuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(AuthServiceApplication.class, args);
	}

	// Without at least one ACTIVE admin, registrations can never be approved.
	@Bean
	CommandLineRunner seedDefaultAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.existsByRoleAndStatus(Role.ADMIN, Status.ACTIVE)) {
				return;
			}
			String email = System.getenv().getOrDefault("VULCAN_ADMIN_EMAIL", "admin@vulcan.com");
			String password = System.getenv().getOrDefault("VULCAN_ADMIN_PASSWORD", "ChangeMe!2026");
			if (userRepository.existsByEmail(email)) {
				userRepository.findByEmail(email).ifPresent(u -> {
					u.setStatus(Status.ACTIVE);
					userRepository.save(u);
				});
			} else {
				userRepository.save(User.builder()
						.fullName("Default Admin")
						.email(email)
						.password(passwordEncoder.encode(password))
						.phoneNumber("N/A")
						.role(Role.ADMIN)
						.status(Status.ACTIVE)
						.build());
			}
			System.out.println("[Vulcan] Seeded default admin '" + email + "' - change the password after first login.");
		};
	}
}
