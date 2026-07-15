package com.vulcan.auth_service.service;

import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.entity.Plan;
import com.vulcan.auth_service.entity.Role;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.repository.CompanyRepository;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class CompanyService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int PREMIUM_LIMIT = 100_000; // effectively unlimited

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    /** Free-plan caps per role. Managers share the admin cap (oversight roles). */
    public static int freeLimit(Role role) {
        return switch (role) {
            case WORKER -> 50;
            case SUPERVISOR -> 5;
            case ADMIN -> 3;
            case MANAGER -> 3;
        };
    }

    public int limitFor(Plan plan, Role role) {
        return plan == Plan.PREMIUM ? PREMIUM_LIMIT : freeLimit(role);
    }

    public long activeCount(Long companyId, Role role) {
        return userRepository.countByCompanyIdAndRoleAndStatus(companyId, role, Status.ACTIVE);
    }

    /** True when the company already has as many active members of this role as its plan allows. */
    public boolean atLimit(Company company, Role role) {
        return activeCount(company.getId(), role) >= limitFor(company.getPlan(), role);
    }

    public String generateJoinCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            code = sb.toString();
        } while (companyRepository.existsByJoinCode(code));
        return code;
    }

    /** Company summary with per-role usage and limits, for the app to render. */
    public Map<String, Object> summary(Company company) {
        Map<String, Object> usage = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("active", activeCount(company.getId(), role));
            row.put("limit", limitFor(company.getPlan(), role));
            usage.put(role.name(), row);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", company.getId());
        out.put("name", company.getName());
        out.put("joinCode", company.getJoinCode());
        out.put("plan", company.getPlan().name());
        out.put("usage", usage);
        return out;
    }
}
