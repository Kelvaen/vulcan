package com.vulcan.worker_service.controller;

import com.vulcan.worker_service.dto.AssignWorkerRequest;
import com.vulcan.worker_service.dto.SiteRequest;
import com.vulcan.worker_service.entity.Site;
import com.vulcan.worker_service.service.WorkerService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    private final WorkerService workerService;

    public WorkerController(WorkerService workerService) {
        this.workerService = workerService;
    }

    @PostMapping("/sites")
    public ResponseEntity<?> createSite(@Valid @RequestBody SiteRequest request,
                                        @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(workerService.createSite(request, companyId));
    }

    @GetMapping("/sites")
    public ResponseEntity<?> getAllSites(
            @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(workerService.getAllSites(companyId));
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignWorker(@Valid @RequestBody AssignWorkerRequest request) {
        return ResponseEntity.ok(workerService.assignWorkerToSite(request));
    }

    @GetMapping("/sites/{siteId}/workers")
    public ResponseEntity<?> getWorkersBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(workerService.getWorkersBySite(siteId));
    }

    // Single site with its coordinates and geofence radius. Used by the
    // attendance service to check a worker is physically near the site.
    @GetMapping("/sites/{siteId}")
    public ResponseEntity<?> getSite(@PathVariable Long siteId) {
        Site site = workerService.getSiteById(siteId);
        if (site == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(site);
    }
}