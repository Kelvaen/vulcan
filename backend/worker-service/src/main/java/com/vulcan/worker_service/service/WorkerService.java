package com.vulcan.worker_service.service;

import com.vulcan.worker_service.dto.AssignWorkerRequest;
import com.vulcan.worker_service.dto.SiteRequest;
import com.vulcan.worker_service.entity.Site;
import com.vulcan.worker_service.entity.SiteAssignment;
import com.vulcan.worker_service.repository.SiteAssignmentRepository;
import com.vulcan.worker_service.repository.SiteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class WorkerService {

    private final SiteRepository siteRepository;
    private final SiteAssignmentRepository siteAssignmentRepository;

    public WorkerService(SiteRepository siteRepository, SiteAssignmentRepository siteAssignmentRepository) {
        this.siteRepository = siteRepository;
        this.siteAssignmentRepository = siteAssignmentRepository;
    }

    public String createSite(SiteRequest request) {
        Site site = new Site();
        site.setName(request.getName());
        site.setLocation(request.getLocation());
        site.setGpsLat(request.getGpsLat());
        site.setGpsLng(request.getGpsLng());
        site.setRadiusMeters(request.getRadiusMeters());
        siteRepository.save(site);
        return "Site created successfully";
    }

    public List<Site> getAllSites() {
        return siteRepository.findAll();
    }

    public String assignWorkerToSite(AssignWorkerRequest request) {
        Optional<Site> siteOpt = siteRepository.findById(request.getSiteId());
        if (siteOpt.isEmpty()) return "Site not found";

        SiteAssignment assignment = new SiteAssignment();
        assignment.setWorkerId(request.getWorkerId());
        assignment.setSite(siteOpt.get());
        siteAssignmentRepository.save(assignment);
        return "Worker assigned to site successfully";
    }

    public List<SiteAssignment> getWorkersBySite(Long siteId) {
        return siteAssignmentRepository.findBySiteId(siteId);
    }
}