package com.vulcan.auth_service.service;

import com.vulcan.auth_service.dto.LoginRequest;
import com.vulcan.auth_service.dto.RegisterCompanyRequest;
import com.vulcan.auth_service.dto.RegisterRequest;
import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.entity.Plan;
import com.vulcan.auth_service.entity.Role;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.CompanyRepository;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
                       CompanyService companyService, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /** Register a new employee into an existing company via its join code. */
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already registered";
        }

        Optional<Company> companyOpt = companyRepository.findByJoinCode(
                request.getJoinCode() == null ? "" : request.getJoinCode().trim().toUpperCase());
        if (companyOpt.isEmpty()) {
            return "Invalid company join code";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .status(Status.PENDING)
                .companyId(companyOpt.get().getId())
                .build();

        userRepository.save(user);
        return "Registration successful. Awaiting admin approval.";
    }

    /** Create a new company and its first (owner) admin, who is active immediately. */
    public String registerCompany(RegisterCompanyRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already registered";
        }

        Company company = new Company();
        company.setName(request.getCompanyName());
        company.setJoinCode(companyService.generateJoinCode());
        company.setPlan(Plan.FREE);
        company = companyRepository.save(company);

        User admin = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.ADMIN)
                .status(Status.ACTIVE)
                .companyId(company.getId())
                .build();
        userRepository.save(admin);

        return "Company created. Your join code is " + company.getJoinCode()
                + " — share it with your team so they can register.";
    }

    public String login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return "Invalid email or password";
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid email or password";
        }

        if (user.getStatus() != Status.ACTIVE) {
            return "Account not yet approved by admin";
        }

        return jwtService.generateToken(user.getEmail(), user.getRole().name(),
                user.getId(), user.getFullName(), user.getCompanyId());
    }
}
