package com.vulcan.attendance_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ClockOutRequest {
    @NotNull(message = "Worker ID is required")
    @Positive(message = "Worker ID must be positive")
    private Long workerId;

    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    private Long siteId;

    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
}