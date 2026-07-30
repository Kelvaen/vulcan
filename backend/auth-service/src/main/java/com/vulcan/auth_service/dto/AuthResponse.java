package com.vulcan.auth_service.dto;

/**
 * Structured response for every auth endpoint. `status` tells the app what to
 * do next:
 *   VERIFY_EMAIL - a signup code was sent; show the OTP screen (SIGNUP)
 *   OTP_SENT     - credentials ok, a login code was sent; show the OTP screen (LOGIN)
 *   VERIFIED     - signup code accepted; the account's email is now confirmed
 *   OK           - login code accepted; `token` holds the JWT
 *   PENDING      - awaiting admin approval
 *   ERROR        - `message` explains why
 *
 * `token` is only set on OK. `devCode` carries the code itself ONLY in mock
 * mode (no BREVO_API_KEY), so the flow is testable without a mail account; it
 * is null once real emails are enabled.
 */
public class AuthResponse {

    private String status;
    private String message;
    private String token;
    private String devCode;

    public AuthResponse() {}

    public AuthResponse(String status, String message) {
        this.status = status;
        this.message = message;
    }

    public static AuthResponse of(String status, String message) {
        return new AuthResponse(status, message);
    }

    public static AuthResponse error(String message) {
        return new AuthResponse("ERROR", message);
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getDevCode() { return devCode; }
    public void setDevCode(String devCode) { this.devCode = devCode; }
}
