package com.vulcan.task_service.dto;

public class CreateTaskRequest {
    private Long siteId;
    private Long workerId;
    private Long assignedBy;
    private String description;

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Long getAssignedBy() { return assignedBy; }
    public void setAssignedBy(Long assignedBy) { this.assignedBy = assignedBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}