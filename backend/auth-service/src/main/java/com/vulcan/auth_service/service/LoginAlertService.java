package com.vulcan.auth_service.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

    private final HttpClient http = HttpClient.newHttpClient();

    public boolean isEnabled() { return !apiKey.isBlank(); }

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

            http.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .exceptionally(e -> null);
        } catch (Exception e) {
            System.out.println("Login alert email failed for " + toEmail + ": " + e.getMessage());
        }
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
