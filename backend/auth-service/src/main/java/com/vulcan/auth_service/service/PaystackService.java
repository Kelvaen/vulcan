package com.vulcan.auth_service.service;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Thin Paystack client for the premium upgrade. Reads PAYSTACK_SECRET_KEY from
 * the environment. When no key is set it runs in "mock" mode so the flow is
 * fully demoable without a Paystack account (initialize returns a reference and
 * verify always succeeds). Responses are parsed with simple string matching so
 * the service needs no extra dependencies.
 */
@Service
public class PaystackService {

    private static final String BASE = "https://api.paystack.co";

    private final String secretKey = System.getenv().getOrDefault("PAYSTACK_SECRET_KEY", "").trim();
    private final String currency = System.getenv().getOrDefault("PAYSTACK_CURRENCY", "GHS");
    private final int amount = parseAmount(System.getenv().getOrDefault("PAYSTACK_PREMIUM_AMOUNT", "20000"));

    private final HttpClient http = HttpClient.newHttpClient();

    private static int parseAmount(String v) {
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return 20000; }
    }

    public boolean isMock() { return secretKey.isBlank(); }
    public int getAmount() { return amount; }          // smallest currency unit (e.g. pesewas)
    public String getCurrency() { return currency; }

    /** Start a transaction; returns reference + hosted authorization URL (empty in mock mode). */
    public Map<String, Object> initialize(String email) {
        String reference = "vulcan_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("reference", reference);
        out.put("amount", amount);
        out.put("currency", currency);
        out.put("mock", isMock());

        if (isMock()) {
            out.put("authorizationUrl", "");
            return out;
        }
        try {
            String safeEmail = (email == null ? "" : email).replace("\"", "");
            String body = "{\"email\":\"" + safeEmail + "\",\"amount\":" + amount
                    + ",\"currency\":\"" + currency + "\",\"reference\":\"" + reference + "\"}";
            HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/transaction/initialize"))
                    .header("Authorization", "Bearer " + secretKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            String json = res.body();
            out.put("authorizationUrl", extract(json, "authorization_url"));
            String ref = extract(json, "reference");
            if (!ref.isBlank()) out.put("reference", ref);
        } catch (Exception e) {
            out.put("authorizationUrl", "");
            out.put("error", e.getMessage());
        }
        return out;
    }

    /** True when the transaction with this reference has been paid (always true in mock mode). */
    public boolean verify(String reference) {
        if (isMock()) return true;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(BASE + "/transaction/verify/" + reference))
                    .header("Authorization", "Bearer " + secretKey)
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            // data.status is the string "success" when paid (top-level status is the boolean true).
            return res.body() != null && res.body().contains("\"status\":\"success\"");
        } catch (Exception e) {
            return false;
        }
    }

    private static String extract(String json, String field) {
        if (json == null) return "";
        Matcher m = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : "";
    }
}
