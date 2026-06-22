package com.vulcan.worker_service.repository;

import com.vulcan.worker_service.entity.SiteAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SiteAssignmentRepository extends JpaRepository<SiteAssignment, Long> {
    List<SiteAssignment> findBySiteId(Long siteId);
    Optional<SiteAssignment> findByWorkerId(Long workerId);
}