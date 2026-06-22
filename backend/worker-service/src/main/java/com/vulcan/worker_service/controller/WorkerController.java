package com.vulcan.worker_service.controller;

import com.vulcan.worker_service.dto.AssignWorkerRequest;
import com.vulcan.worker_service.dto.SiteRequest;
import com.vulcan.worker_service.service.WorkerService;
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
    public ResponseEntity<?> createSite(@RequestBody SiteRequest request) {
        return ResponseEntity.ok(workerService.createSite(request));
    }

    @GetMapping("/sites")
    public ResponseEntity<?> getAllSites() {
        return ResponseEntity.ok(workerService.getAllSites());
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignWorker(@RequestBody AssignWorkerRequest request) {
        return ResponseEntity.ok(workerService.assignWorkerToSite(request));
    }

    @GetMapping("/sites/{siteId}/workers")
    public ResponseEntity<?> getWorkersBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(workerService.getWorkersBySite(siteId));
    }
}