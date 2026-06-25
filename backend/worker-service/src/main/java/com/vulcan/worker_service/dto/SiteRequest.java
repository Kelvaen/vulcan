package com.vulcan.worker_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class SiteRequest {
    @NotBlank(message = "Site name is required")
    private String name;

    private String location;

    @NotNull(message = "GPS latitude is required")
    private Double gpsLat;

    @NotNull(message = "GPS longitude is required")
    private Double gpsLng;

    @Positive(message = "Radius must be a positive number")
    private Double radiusMeters;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getGpsLat() { return gpsLat; }
    public void setGpsLat(Double gpsLat) { this.gpsLat = gpsLat; }
    public Double getGpsLng() { return gpsLng; }
    public void setGpsLng(Double gpsLng) { this.gpsLng = gpsLng; }
    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }
}