package com.vulcan.attendance_service.dto;

public class SiteAssignmentDto {
    private Long id;
    private Long workerId;
    private SiteDto site;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public SiteDto getSite() { return site; }
    public void setSite(SiteDto site) { this.site = site; }
}