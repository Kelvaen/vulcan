package com.vulcan.worker_service.dto;

public class AssignWorkerRequest {
    private Long workerId;
    private Long siteId;

    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
}