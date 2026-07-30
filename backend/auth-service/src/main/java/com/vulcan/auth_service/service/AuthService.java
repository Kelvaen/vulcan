package com.vulcan.auth_service.service;

import com.vulcan.auth_service.dto.AuthResponse;
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

    private static final String SIGNUP = "SIGNUP";
    private static final String LOGIN = "LOGIN";

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LoginAlertService loginAlertService;
    private final OtpService otpService;

    public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
                       CompanyService companyService, PasswordEncoder passwordEncoder, JwtService jwtService,
                       LoginAlertService loginAlertService, OtpService otpService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.loginAlertService = loginAlertService;
        this.otpService = otpService;
    }

    /** Register a new employee into an existing company via its join code. */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.error("Email already registered");
        }

        Optional<Company> companyOpt = companyRepository.findByJoinCode(
                request.getJoinCode() == null ? "" : request.getJoinCode().trim().toUpperCase());
        if (companyOpt.isEmpty()) {
            return AuthResponse.error("Invalid company join code");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(request.getRole())
                .status(Status.PENDING)
                .companyId(companyOpt.get().getId())
                .emailVerified(false)
                .build();

        userRepository.save(user);
        return verifyEmailResponse(user,
                "Registration received. Enter the code we emailed you to verify your address, "
                        + "then wait for admin approval.");
    }

    /** Create a new company and its first (owner) admin, who is active immediately. */
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.error("Email already registered");
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
                .emailVerified(false)
                .build();
        userRepository.save(admin);

        return verifyEmailResponse(admin,
                "Company created. Your join code is " + company.getJoinCode()
                        + " — share it with your team. Enter the code we emailed you to verify your address.");
    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return AuthResponse.error("Invalid email or password");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.error("Invalid email or password");
        }

        // Unverified email must be confirmed first — resend the signup code.
        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            return verifyEmailResponse(user,
                    "Please verify your email first. We've sent you a new code.");
        }

        if (user.getStatus() != Status.ACTIVE) {
            return AuthResponse.of("PENDING", "Account not yet approved by admin");
        }

        // Credentials are good; send a login code and complete on verify-otp.
        String devCode = otpService.generateAndSend(user.getEmail(), user.getFullName(), LOGIN);
        AuthResponse res = AuthResponse.of("OTP_SENT",
                "We emailed a login code to " + user.getEmail() + ".");
        res.setDevCode(devCode);
        return res;
    }

    /** Second step for both flows: check the emailed code and act on it. */
    public AuthResponse verifyOtp(String email, String code, String purpose) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return AuthResponse.error("Invalid email or password");
        }
        String p = purpose == null ? "" : purpose.trim().toUpperCase();
        if (!otpService.verify(email, code, p)) {
            return AuthResponse.error("Invalid or expired code. Request a new one.");
        }

        User user = userOpt.get();

        if (SIGNUP.equals(p)) {
            user.setEmailVerified(true);
            userRepository.save(user);
            String msg = user.getStatus() == Status.ACTIVE
                    ? "Email verified. You can now sign in."
                    : "Email verified. Your account is now awaiting admin approval.";
            return AuthResponse.of("VERIFIED", msg);
        }

        // LOGIN: issue the token now that the code checks out.
        if (user.getStatus() != Status.ACTIVE) {
            return AuthResponse.of("PENDING", "Account not yet approved by admin");
        }
        loginAlertService.sendLoginAlert(user.getEmail(), user.getFullName());
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(),
                user.getId(), user.getFullName(), user.getCompanyId());
        AuthResponse res = AuthResponse.of("OK", "Signed in");
        res.setToken(token);
        return res;
    }

    /** Re-send a code for either flow. */
    public AuthResponse resendOtp(String email, String purpose) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal whether the email exists.
            return AuthResponse.of("SENT", "If that email has an account, a new code is on its way.");
        }
        User user = userOpt.get();
        String p = purpose == null ? "" : purpose.trim().toUpperCase();
        String usePurpose = SIGNUP.equals(p) ? SIGNUP : LOGIN;
        String devCode = otpService.generateAndSend(user.getEmail(), user.getFullName(), usePurpose);
        AuthResponse res = AuthResponse.of("SENT", "A new code is on its way.");
        res.setDevCode(devCode);
        return res;
    }

    private AuthResponse verifyEmailResponse(User user, String message) {
        String devCode = otpService.generateAndSend(user.getEmail(), user.getFullName(), SIGNUP);
        AuthResponse res = AuthResponse.of("VERIFY_EMAIL", message);
        res.setDevCode(devCode);
        return res;
    }
}
