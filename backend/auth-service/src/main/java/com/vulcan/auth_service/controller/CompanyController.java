package com.vulcan.auth_service.controller;

import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.repository.CompanyRepository;
import com.vulcan.auth_service.service.CompanyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyRepository companyRepository;
    private final CompanyService companyService;

    public CompanyController(CompanyRepository companyRepository, CompanyService companyService) {
        this.companyRepository = companyRepository;
        this.companyService = companyService;
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<?> getCompany(@PathVariable Long companyId) {
        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(companyService.summary(company));
    }
}
