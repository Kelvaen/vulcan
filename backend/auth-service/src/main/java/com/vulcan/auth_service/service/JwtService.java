package com.vulcan.auth_service.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final String SECRET_KEY = System.getenv().getOrDefault("VULCAN_JWT_SECRET", "vulcan-secret-key-must-be-at-least-32-chars");
    private final long EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateToken(String email, String role) {
        return generateToken(email, role, null, null);
    }

    // userId/fullName ride along as claims so clients know who logged in
    // without an extra round-trip. Older callers keep working.
    public String generateToken(String email, String role, Long userId, String fullName) {
        var builder = Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION));
        if (userId != null) builder.claim("userId", userId);
        if (fullName != null) builder.claim("fullName", fullName);
        return builder.signWith(getKey()).compact();
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }
}