package com.vulcan.auth_service.repository;

import com.vulcan.auth_service.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {

    /** The most recent unused code for this email + purpose, if any. */
    Optional<EmailOtp> findTopByEmailAndPurposeAndConsumedFalseOrderByIdDesc(String email, String purpose);

    /** All outstanding (unused) codes for this email + purpose. */
    List<EmailOtp> findByEmailAndPurposeAndConsumedFalse(String email, String purpose);
}
