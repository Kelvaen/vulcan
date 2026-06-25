package com.vulcan.task_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CreateTaskRequest {
    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    private Long siteId;

    @NotNull(message = "Worker ID is required")
    @Positive(message = "Worker ID must be positive")
    private Long workerId;

    @NotNull(message = "Assigned by is required")
    @Positive(message = "Assigned by must be positive")
    private Long assignedBy;

    @NotBlank(message = "Task description is required")
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