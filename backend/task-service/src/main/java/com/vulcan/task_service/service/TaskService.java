package com.vulcan.task_service.service;

import com.vulcan.task_service.dto.CreateTaskRequest;
import com.vulcan.task_service.dto.UpdateTaskStatusRequest;
import com.vulcan.task_service.entity.Task;
import com.vulcan.task_service.entity.TaskStatus;
import com.vulcan.task_service.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public String createTask(CreateTaskRequest request) {
        Task task = new Task();
        task.setSiteId(request.getSiteId());
        task.setWorkerId(request.getWorkerId());
        task.setAssignedBy(request.getAssignedBy());
        task.setDescription(request.getDescription());
        taskRepository.save(task);
        return "Task assigned successfully";
    }

    public List<Task> getTasksForWorkerToday(Long workerId) {
        return taskRepository.findByWorkerIdAndTaskDate(workerId, LocalDate.now());
    }

    public List<Task> getTasksForSiteToday(Long siteId) {
        return taskRepository.findBySiteIdAndTaskDate(siteId, LocalDate.now());
    }

    public String updateTaskStatus(Long taskId, UpdateTaskStatusRequest request) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isEmpty()) return "Task not found";

        Task task = taskOpt.get();
        task.setStatus(request.getStatus());
        taskRepository.save(task);
        return "Task status updated to " + request.getStatus();
    }

    public List<Task> getWorkerTasksByStatus(Long workerId, TaskStatus status) {
        return taskRepository.findByWorkerIdAndStatus(workerId, status);
    }
}