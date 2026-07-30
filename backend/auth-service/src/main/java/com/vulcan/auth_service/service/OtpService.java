package com.vulcan.auth_service.service;

import com.vulcan.auth_service.entity.EmailOtp;
import com.vulcan.auth_service.repository.EmailOtpRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Issues and checks the 6-digit email codes used for signup verification and
 * login 2FA. Delivery goes through {@link LoginAlertService} (Brevo). When no
 * mail key is configured it runs in mock mode: the code is returned to the
 * caller (as devCode) and logged, so the whole flow is testable without a mail
 * account.
 */
@Service
public class OtpService {

    private static final int TTL_MINUTES = 10;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailOtpRepository otpRepository;
    private final LoginAlertService emailService;

    public OtpService(EmailOtpRepository otpRepository, LoginAlertService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    /**
     * Create a fresh code for this email + purpose, invalidate any earlier
     * outstanding ones, email it, and return the code only when running in mock
     * mode (no mail key) so the app can display it; otherwise null.
     */
    public String generateAndSend(String email, String name, String purpose) {
        // Retire any earlier unused codes so only the newest one works.
        List<EmailOtp> outstanding = otpRepository.findByEmailAndPurposeAndConsumedFalse(email, purpose);
        for (EmailOtp old : outstanding) {
            old.setConsumed(true);
        }
        otpRepository.saveAll(outstanding);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        EmailOtp otp = new EmailOtp();
        otp.setEmail(email);
        otp.setCode(code);
        otp.setPurpose(purpose);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES));
        otp.setConsumed(false);
        otpRepository.save(otp);

        emailService.sendOtp(email, name, code, purpose);

        if (!emailService.isEnabled()) {
            System.out.println("[OTP mock] " + purpose + " code for " + email + " is " + code);
            return code; // surfaced to the app as devCode so it stays testable
        }
        return null;
    }

    /** True when the given code is the newest unused, unexpired one; consumes it. */
    public boolean verify(String email, String code, String purpose) {
        Optional<EmailOtp> match =
                otpRepository.findTopByEmailAndPurposeAndConsumedFalseOrderByIdDesc(email, purpose);
        if (match.isEmpty()) return false;

        EmailOtp otp = match.get();
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) return false;
        if (!otp.getCode().equals(code == null ? null : code.trim())) return false;

        otp.setConsumed(true);
        otpRepository.save(otp);
        return true;
    }
}
