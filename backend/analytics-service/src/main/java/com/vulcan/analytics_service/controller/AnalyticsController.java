package com.vulcan.analytics_service.controller;

import com.vulcan.analytics_service.dto.DashboardResponse;
import com.vulcan.analytics_service.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard(@RequestParam String payPeriod) {
        return ResponseEntity.ok(analyticsService.getDashboard(payPeriod));
    }
}