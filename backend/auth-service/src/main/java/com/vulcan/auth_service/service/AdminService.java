package com.vulcan.auth_service.service;

import com.vulcan.auth_service.entity.Company;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.CompanyRepository;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyService companyService;

    public AdminService(UserRepository userRepository, CompanyRepository companyRepository,
                        CompanyService companyService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.companyService = companyService;
    }

    public String approveUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return "User not found";
        User user = userOpt.get();

        // Enforce the company's plan limits for this role.
        if (user.getCompanyId() != null) {
            Company company = companyRepository.findById(user.getCompanyId()).orElse(null);
            if (company != null && companyService.atLimit(company, user.getRole())) {
                int limit = companyService.limitFor(company.getPlan(), user.getRole());
                return "Plan limit reached: " + limit + " " + user.getRole().name().toLowerCase()
                        + "s on the " + company.getPlan().name().toLowerCase()
                        + " plan. Upgrade to premium to add more.";
            }
        }

        user.setStatus(Status.ACTIVE);
        userRepository.save(user);
        return "User approved successfully";
    }

    public String rejectUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return "User not found";
        User user = userOpt.get();
        user.setStatus(Status.INACTIVE);
        userRepository.save(user);
        return "User rejected";
    }

    public List<User> getPendingUsers(Long companyId) {
        if (companyId == null) return userRepository.findByStatus(Status.PENDING);
        return userRepository.findByCompanyIdAndStatus(companyId, Status.PENDING);
    }

    public List<User> getActiveUsers(Long companyId) {
        if (companyId == null) return userRepository.findByStatus(Status.ACTIVE);
        return userRepository.findByCompanyIdAndStatus(companyId, Status.ACTIVE);
    }
}
