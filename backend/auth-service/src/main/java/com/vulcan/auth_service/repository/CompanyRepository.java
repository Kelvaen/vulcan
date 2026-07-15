package com.vulcan.auth_service.repository;

import com.vulcan.auth_service.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    Optional<Company> findByJoinCode(String joinCode);
    boolean existsByJoinCode(String joinCode);
}
