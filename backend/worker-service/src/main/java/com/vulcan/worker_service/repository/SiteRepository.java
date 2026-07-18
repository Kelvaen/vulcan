package com.vulcan.worker_service.repository;

import com.vulcan.worker_service.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SiteRepository extends JpaRepository<Site, Long> {
    List<Site> findByCompanyId(Long companyId);
    List<Site> findByCompanyIdIsNull();
}