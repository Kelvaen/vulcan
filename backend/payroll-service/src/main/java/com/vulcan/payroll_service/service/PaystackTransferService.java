package com.vulcan.payroll_service.service;

import com.vulcan.payroll_service.entity.PaymentMethod;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Pays a worker's wage to their mobile-money wallet via Paystack Transfers.
 * Reads PAYSTACK_SECRET_KEY from the environment; with no key it runs in mock
 * mode (transfers are simulated as successful) so payroll is demoable without a
 * funded Paystack business account. No extra dependencies — responses are parsed
 * with simple string matching.
 */
@Service
public class PaystackTransferService {

    private static final String BASE = "https://api.paystack.co";

    private final String secretKey = System.getenv().getOrDefault("PAYSTACK_SECRET_KEY", "").trim();
    private final String currency = System.getenv().getOrDefault("PAYSTACK_CURRENCY", "GHS");
    private final HttpClient http = HttpClient.newHttpClient();

    public boolean isMock() { return secretKey.isBlank(); }

    /** Paystack Ghana mobile-money bank codes. */
    public static String bankCode(PaymentMethod method) {
        return switch (method) {
            case MTN_MOMO -> "MTN";
            case TELECEL_CASH -> "VOD";
            case AIRTELTIGO_MONEY -> "ATL";
            default -> null; // not a mobile-money method
        };
    }

    public static class Result {
        public final boolean success;
        public final String message;
        public Result(boolean success, String message) { this.success = success; this.message = message; }
    }

    /** Create a recipient then send the wage. amount is in major units (e.g. GHS). */
    public Result payout(String name, String momoNumber, PaymentMethod method, double amount) {
        String code = bankCode(method);
        if (code == null) {
            return new Result(false, "Not a mobile-money payment method");
        }
        int minor = (int) Math.round(amount * 100); // pesewas

        if (isMock()) {
            return new Result(true, "Paid " + currency + " " + amount + " to " + momoNumber
                    + " (" + method + ") — simulated (no Paystack key configured)");
        }

        try {
            // 1) create transfer recipient
            String recBody = "{\"type\":\"mobile_money\",\"name\":\"" + safe(name) + "\",\"account_number\":\""
                    + safe(momoNumber) + "\",\"bank_code\":\"" + code + "\",\"currency\":\"" + currency + "\"}";
            HttpResponse<String> recRes = http.send(
                    HttpRequest.newBuilder(URI.create(BASE + "/transferrecipient"))
                            .header("Authorization", "Bearer " + secretKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(recBody)).build(),
                    HttpResponse.BodyHandlers.ofString());
            String recipientCode = extract(recRes.body(), "recipient_code");
            if (recipientCode.isBlank()) {
                return new Result(false, "Could not create recipient: " + trim(recRes.body()));
            }

            // 2) initiate transfer
            String trBody = "{\"source\":\"balance\",\"amount\":" + minor + ",\"recipient\":\"" + recipientCode
                    + "\",\"reason\":\"Vulcan wage payout\",\"currency\":\"" + currency + "\"}";
            HttpResponse<String> trRes = http.send(
                    HttpRequest.newBuilder(URI.create(BASE + "/transfer"))
                            .header("Authorization", "Bearer " + secretKey)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(trBody)).build(),
                    HttpResponse.BodyHandlers.ofString());
            String status = extract(trRes.body(), "status"); // data.status: success/pending/otp
            String transferCode = extract(trRes.body(), "transfer_code");
            if (!transferCode.isBlank() && (status.equals("success") || status.equals("pending"))) {
                return new Result(true, "Transfer " + status + " (" + transferCode + ")");
            }
            return new Result(false, "Transfer not accepted: " + trim(trRes.body()));
        } catch (Exception e) {
            return new Result(false, "Payout failed: " + e.getMessage());
        }
    }

    private static String safe(String v) { return v == null ? "" : v.replace("\"", ""); }
    private static String trim(String v) { return v == null ? "" : v.substring(0, Math.min(v.length(), 160)); }

    private static String extract(String json, String field) {
        if (json == null) return "";
        Matcher m = Pattern.compile("\"" + Pattern.quote(field) + "\"\\s*:\\s*\"([^\"]*)\"").matcher(json);
        return m.find() ? m.group(1) : "";
    }
}
