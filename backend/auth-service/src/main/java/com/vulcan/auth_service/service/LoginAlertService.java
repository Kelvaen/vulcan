package com.vulcan.auth_service.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyStore;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

/**
 * Sends a "new sign-in" alert email on every successful login using Brevo's
 * transactional email API. Reads BREVO_API_KEY from the environment; when no
 * key is set it does nothing, so logins work fine without an email account
 * (same mock-friendly pattern as {@link PaystackService}). Uses the built-in
 * HttpClient so no extra dependency is needed, and sends asynchronously so a
 * slow mail API never delays the login response. Best-effort: an email failure
 * never affects the login result.
 */
@Service
public class LoginAlertService {

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";
    private static final DateTimeFormatter WHEN =
            DateTimeFormatter.ofPattern("d MMM yyyy 'at' HH:mm");

    private final String apiKey = System.getenv().getOrDefault("BREVO_API_KEY", "").trim();
    private final String fromEmail = System.getenv().getOrDefault("MAIL_FROM", "no-reply@vulcan.app").trim();
    private final String fromName = System.getenv().getOrDefault("MAIL_FROM_NAME", "Vulcan Security").trim();

    private final HttpClient http = buildClient();

    public boolean isEnabled() { return !apiKey.isBlank(); }

    /**
     * On Windows, trust the OS certificate store (Windows-ROOT) so the HTTPS
     * call to Brevo succeeds even behind corporate/HTTPS-inspection proxies whose
     * root certificate is installed in Windows but not in the JVM's own cacerts.
     * Falls back to the default client everywhere else.
     */
    private static HttpClient buildClient() {
        try {
            if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
                KeyStore ks = KeyStore.getInstance("Windows-ROOT");
                ks.load(null, null);
                TrustManagerFactory tmf =
                        TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                tmf.init(ks);
                SSLContext ctx = SSLContext.getInstance("TLS");
                ctx.init(null, tmf.getTrustManagers(), null);
                return HttpClient.newBuilder().sslContext(ctx).build();
            }
        } catch (Exception e) {
            System.out.println("Email client: falling back to default trust store (" + e.getMessage() + ")");
        }
        return HttpClient.newHttpClient();
    }

    /** Fire-and-forget login alert. Never throws, never blocks the caller. */
    public void sendLoginAlert(String toEmail, String fullName) {
        if (!isEnabled() || toEmail == null || toEmail.isBlank()) return;
        try {
            String name = (fullName == null || fullName.isBlank()) ? "there" : fullName;
            String when = LocalDateTime.now().format(WHEN);
            String text = "Hi " + name + ",\n\n"
                    + "Your Vulcan account was just signed in to on " + when + ".\n\n"
                    + "If this was you, no action is needed. If you don't recognise this "
                    + "sign-in, change your password right away.\n\n— Vulcan Security";

            String body = "{"
                    + "\"sender\":{\"name\":\"" + esc(fromName) + "\",\"email\":\"" + esc(fromEmail) + "\"},"
                    + "\"to\":[{\"email\":\"" + esc(toEmail) + "\",\"name\":\"" + esc(name) + "\"}],"
                    + "\"subject\":\"New sign-in to your Vulcan account\","
                    + "\"textContent\":\"" + esc(text) + "\""
                    + "}";

            HttpRequest req = HttpRequest.newBuilder(URI.create(BREVO_URL))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            fireAndLog(req, toEmail);
        } catch (Exception e) {
            System.out.println("Login alert email failed for " + toEmail + ": " + e.getMessage());
        }
    }

    /**
     * Email a one-time code for signup verification or login 2FA. Fire-and-forget
     * like the login alert; the code is also stored server-side so a slow mail
     * API never blocks the request. Does nothing when no mail key is set (the
     * OtpService surfaces the code another way in that mock mode).
     */
    public void sendOtp(String toEmail, String fullName, String code, String purpose) {
        if (!isEnabled() || toEmail == null || toEmail.isBlank()) return;
        try {
            String name = (fullName == null || fullName.isBlank()) ? "there" : fullName;
            boolean signup = "SIGNUP".equalsIgnoreCase(purpose);
            String subject = signup ? "Verify your Vulcan email" : "Your Vulcan login code";
            String line = signup
                    ? "Use this code to verify your email and finish setting up your account:"
                    : "Use this code to finish signing in:";
            String text = "Hi " + name + ",\n\n" + line + "\n\n    " + code + "\n\n"
                    + "It expires in 10 minutes. If you didn't request this, you can ignore this email.\n\n— Vulcan";

            String body = "{"
                    + "\"sender\":{\"name\":\"" + esc(fromName) + "\",\"email\":\"" + esc(fromEmail) + "\"},"
                    + "\"to\":[{\"email\":\"" + esc(toEmail) + "\",\"name\":\"" + esc(name) + "\"}],"
                    + "\"subject\":\"" + esc(subject) + "\","
                    + "\"textContent\":\"" + esc(text) + "\""
                    + "}";

            HttpRequest req = HttpRequest.newBuilder(URI.create(BREVO_URL))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            fireAndLog(req, toEmail);
        } catch (Exception e) {
            System.out.println("OTP email failed for " + toEmail + ": " + e.getMessage());
        }
    }

    /**
     * Send the request without blocking the caller, but log Brevo's answer so a
     * rejected send (e.g. an unverified sender address, which is NOT an
     * exception but a 400 response) is visible instead of silently swallowed.
     */
    private void fireAndLog(HttpRequest req, String toEmail) {
        http.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                .thenAccept(resp -> {
                    if (resp.statusCode() >= 300) {
                        System.out.println("Brevo email rejected (" + resp.statusCode()
                                + ") for " + toEmail + ": " + resp.body());
                    } else {
                        System.out.println("Brevo email accepted for " + toEmail
                                + " (" + resp.statusCode() + ")");
                    }
                })
                .exceptionally(e -> {
                    System.out.println("Brevo email error for " + toEmail + ": " + e.getMessage());
                    return null;
                });
    }

    /** Minimal JSON string escaping for the values above. */
    private static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length() + 8);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': b.append("\\\\"); break;
                case '"': b.append("\\\""); break;
                case '\n': b.append("\\n"); break;
                case '\r': break;
                case '\t': b.append("\\t"); break;
                default: b.append(c);
            }
        }
        return b.toString();
    }
}
