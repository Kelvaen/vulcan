package com.vulcan.task_service.controller;

import com.vulcan.task_service.dto.CreateTaskRequest;
import com.vulcan.task_service.dto.UpdateTaskStatusRequest;
import com.vulcan.task_service.entity.TaskStatus;
import com.vulcan.task_service.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<?> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @GetMapping("/worker/{workerId}/today")
    public ResponseEntity<?> getTasksForWorkerToday(@PathVariable Long workerId) {
        return ResponseEntity.ok(taskService.getTasksForWorkerToday(workerId));
    }

    @GetMapping("/site/{siteId}/today")
    public ResponseEntity<?> getTasksForSiteToday(@PathVariable Long siteId) {
        return ResponseEntity.ok(taskService.getTasksForSiteToday(siteId));
    }

    @PutMapping("/{taskId}/status")
    public ResponseEntity<?> updateTaskStatus(@PathVariable Long taskId,
                                              @RequestBody UpdateTaskStatusRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request));
    }

    @GetMapping("/worker/{workerId}/status/{status}")
    public ResponseEntity<?> getWorkerTasksByStatus(@PathVariable Long workerId,
                                                    @PathVariable TaskStatus status) {
        return ResponseEntity.ok(taskService.getWorkerTasksByStatus(workerId, status));
    }
}