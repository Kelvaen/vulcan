package com.vulcan.auth_service.service;

import com.vulcan.auth_service.dto.LoginRequest;
import com.vulcan.auth_service.dto.RegisterRequest;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already registered";
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .status(Status.PENDING)
                .build();

        userRepository.save(user);
        return "Registration successful. Awaiting admin approval.";
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

        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}