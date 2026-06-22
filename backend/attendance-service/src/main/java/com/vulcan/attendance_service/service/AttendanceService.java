package com.vulcan.attendance_service.service;

import com.vulcan.attendance_service.dto.ClockInRequest;
import com.vulcan.attendance_service.dto.ClockOutRequest;
import com.vulcan.attendance_service.dto.SiteAssignmentDto;
import com.vulcan.attendance_service.entity.Attendance;
import com.vulcan.attendance_service.entity.AttendanceStatus;
import com.vulcan.attendance_service.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RestTemplate restTemplate;

    @Value("${services.worker.url}")
    private String workerServiceUrl;

    public AttendanceService(AttendanceRepository attendanceRepository, RestTemplate restTemplate) {
        this.attendanceRepository = attendanceRepository;
        this.restTemplate = restTemplate;
    }

    public String clockIn(ClockInRequest request) {
        // Check if already clocked in today
        Optional<Attendance> existing = attendanceRepository
                .findByWorkerIdAndAttendanceDate(request.getWorkerId(), LocalDate.now());
        if (existing.isPresent()) {
            return "Already clocked in today";
        }

        // Validate worker is assigned to this site
        if (!isWorkerAssignedToSite(request.getWorkerId(), request.getSiteId())) {
            return "Worker is not assigned to this site";
        }

        Attendance attendance = new Attendance();
        attendance.setWorkerId(request.getWorkerId());
        attendance.setSiteId(request.getSiteId());
        attendance.setClockIn(LocalDateTime.now());
        attendance.setStatus(AttendanceStatus.PRESENT);

        attendanceRepository.save(attendance);
        return "Clocked in successfully";
    }

    private boolean isWorkerAssignedToSite(Long workerId, Long siteId) {
        try {
            SiteAssignmentDto[] assignments = restTemplate.getForObject(
                    workerServiceUrl + "/api/workers/sites/" + siteId + "/workers",
                    SiteAssignmentDto[].class);

            if (assignments == null) return false;

            for (SiteAssignmentDto assignment : assignments) {
                if (assignment.getWorkerId().equals(workerId)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            System.out.println("Error checking worker assignment: " + e.getMessage());
            // If Worker Service is unreachable, allow clock-in to avoid blocking workers
            // due to a downstream outage (fail-open)
            return true;
        }
    }

    public String clockOut(ClockOutRequest request) {
        Optional<Attendance> existing = attendanceRepository
                .findByWorkerIdAndAttendanceDate(request.getWorkerId(), LocalDate.now());

        if (existing.isEmpty()) {
            return "No clock-in record found for today";
        }

        Attendance attendance = existing.get();
        if (attendance.getClockOut() != null) {
            return "Already clocked out today";
        }

        attendance.setClockOut(LocalDateTime.now());
        attendanceRepository.save(attendance);
        return "Clocked out successfully";
    }

    public String checkGhostWorker(Long workerId) {
        long absentDays = attendanceRepository
                .countByWorkerIdAndStatus(workerId, AttendanceStatus.ABSENT);

        if (absentDays >= 60) {
            return "GHOST_WORKER";
        }
        return "ACTIVE";
    }

    public long getPresentCountForPeriod(Long workerId, String payPeriod) {
        return attendanceRepository.findAllByWorkerIdOrderByAttendanceDateDesc(workerId).stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .filter(a -> a.getAttendanceDate() != null && a.getAttendanceDate().toString().startsWith(payPeriod))
                .count();
    }
}