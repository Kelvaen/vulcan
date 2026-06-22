package com.vulcan.task_service.dto;

import com.vulcan.task_service.entity.TaskStatus;

public class UpdateTaskStatusRequest {
    private TaskStatus status;

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
}