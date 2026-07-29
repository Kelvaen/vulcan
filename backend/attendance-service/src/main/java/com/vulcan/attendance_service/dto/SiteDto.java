package com.vulcan.attendance_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** A site as returned by the worker service, including its geofence. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SiteDto {
    private Long id;
    private String name;
    private Double gpsLat;
    private Double gpsLng;
    private Double radiusMeters;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getGpsLat() { return gpsLat; }
    public void setGpsLat(Double gpsLat) { this.gpsLat = gpsLat; }
    public Double getGpsLng() { return gpsLng; }
    public void setGpsLng(Double gpsLng) { this.gpsLng = gpsLng; }
    public Double getRadiusMeters() { return radiusMeters; }
    public void setRadiusMeters(Double radiusMeters) { this.radiusMeters = radiusMeters; }
}
