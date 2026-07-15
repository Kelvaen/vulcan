package com.vulcan.auth_service.repository;

import com.vulcan.auth_service.entity.Role;
import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByStatus(Status status);
    boolean existsByRoleAndStatus(Role role, Status status);

    // Company-scoped queries for multi-tenancy and plan limits.
    List<User> findByCompanyIdAndStatus(Long companyId, Status status);
    long countByCompanyIdAndRoleAndStatus(Long companyId, Role role, Status status);
    List<User> findByCompanyIdIsNull();
}