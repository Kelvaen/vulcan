package com.vulcan.auth_service.controller;

import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.entity.Plan;
import com.vulcan.auth_service.repository.CompanyRepository;
import com.vulcan.auth_service.service.CompanyService;
import com.vulcan.auth_service.service.PaystackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;
    private final PaystackService paystackService;

    public CompanyController(CompanyRepository companyRepository, CompanyService companyService,
                             PaystackService paystackService) {
        this.companyRepository = companyRepository;
        this.companyService = companyService;
        this.paystackService = paystackService;
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<?> getCompany(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(companyService.summary(company));
    }

    /** Premium price + whether Paystack is live or running in demo (mock) mode. */
    @GetMapping("/premium-price")
    public ResponseEntity<?> premiumPrice() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("amount", paystackService.getAmount());
        out.put("currency", paystackService.getCurrency());
        out.put("mock", paystackService.isMock());
        return ResponseEntity.ok(out);
    }

    /** Step 1: start a Paystack transaction for this company's premium upgrade. */
    @PostMapping("/{companyId}/upgrade/init")
    public ResponseEntity<?> upgradeInit(@PathVariable Long companyId, @RequestBody(required = false) Map<String, String> body) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.notFound().build();
        if (company.getPlan() == Plan.PREMIUM) {
            return ResponseEntity.ok(Map.of("alreadyPremium", true));
        }
        String email = body == null ? "" : body.getOrDefault("email", "");
        return ResponseEntity.ok(paystackService.initialize(email));
    }

    /** Step 2: confirm payment and flip the company to premium. */
    @PostMapping("/{companyId}/upgrade/verify")
    public ResponseEntity<?> upgradeVerify(@PathVariable Long companyId, @RequestBody Map<String, String> body) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.notFound().build();

        String reference = body.getOrDefault("reference", "");
        Map<String, Object> out = new LinkedHashMap<>();
        if (!paystackService.verify(reference)) {
            out.put("success", false);
            out.put("message", "Payment not confirmed yet. Complete the payment and try again.");
            return ResponseEntity.ok(out);
        }

        company.setPlan(Plan.PREMIUM);
        companyRepository.save(company);
        out.put("success", true);
        out.put("message", "Upgraded to Premium. Your seat limits are now lifted.");
        out.put("company", companyService.summary(company));
        return ResponseEntity.ok(out);
    }
}
