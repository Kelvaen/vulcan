package com.vulcan.task_service.repository;

import com.vulcan.task_service.entity.Task;
import com.vulcan.task_service.entity.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByWorkerIdAndTaskDate(Long workerId, LocalDate date);
    List<Task> findBySiteIdAndTaskDate(Long siteId, LocalDate date);
    List<Task> findByWorkerIdAndStatus(Long workerId, TaskStatus status);
}