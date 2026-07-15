package com.vulcan.auth_service;

import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.entity.Plan;
import com.vulcan.auth_service.entity.Role;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.CompanyRepository;
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

	// Bootstrap: ensure a default company exists, back-fill any company-less
	// users into it, and seed an owner admin so registrations can be approved.
	@Bean
	CommandLineRunner bootstrap(UserRepository userRepository, CompanyRepository companyRepository,
	                            PasswordEncoder passwordEncoder) {
		return args -> {
			Company defaultCompany = companyRepository.findByJoinCode("VULCAN")
					.orElseGet(() -> {
						Company c = new Company();
						c.setName("Vulcan Demo Co.");
						c.setJoinCode("VULCAN");
						c.setPlan(Plan.FREE);
						return companyRepository.save(c);
					});

			// Move any pre-multitenancy users into the default company.
			userRepository.findByCompanyIdIsNull().forEach(u -> {
				u.setCompanyId(defaultCompany.getId());
				userRepository.save(u);
			});

			String email = System.getenv().getOrDefault("VULCAN_ADMIN_EMAIL", "admin@vulcan.com");
			String password = System.getenv().getOrDefault("VULCAN_ADMIN_PASSWORD", "ChangeMe!2026");
			if (userRepository.existsByEmail(email)) {
				userRepository.findByEmail(email).ifPresent(u -> {
					u.setStatus(Status.ACTIVE);
					if (u.getCompanyId() == null) u.setCompanyId(defaultCompany.getId());
					userRepository.save(u);
				});
			} else if (!userRepository.existsByRoleAndStatus(Role.ADMIN, Status.ACTIVE)) {
				userRepository.save(User.builder()
						.fullName("Default Admin")
						.email(email)
						.password(passwordEncoder.encode(password))
						.phoneNumber("N/A")
						.role(Role.ADMIN)
						.status(Status.ACTIVE)
						.companyId(defaultCompany.getId())
						.build());
			}
			System.out.println("[Vulcan] Bootstrap complete. Default company join code: "
					+ defaultCompany.getJoinCode());
		};
	}
}
