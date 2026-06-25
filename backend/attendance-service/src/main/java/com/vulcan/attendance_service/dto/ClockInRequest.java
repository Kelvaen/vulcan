package com.vulcan.attendance_service.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ClockInRequest {
    @NotNull(message = "Worker ID is required")
    @Positive(message = "Worker ID must be positive")
    private Long workerId;

    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    private Long siteId;

    @NotNull(message = "GPS latitude is required")
    private Double gpsLat;

    @NotNull(message = "GPS longitude is required")
    private Double gpsLng;

    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public Double getGpsLat() { return gpsLat; }
    public void setGpsLat(Double gpsLat) { this.gpsLat = gpsLat; }
    public Double getGpsLng() { return gpsLng; }
    public void setGpsLng(Double gpsLng) { this.gpsLng = gpsLng; }
}