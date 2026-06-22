package com.vulcan.attendance_service.service;

import com.vulcan.attendance_service.dto.SiteAssignmentDto;
import com.vulcan.attendance_service.dto.SiteDto;
import com.vulcan.attendance_service.entity.Attendance;
import com.vulcan.attendance_service.entity.AttendanceStatus;
import com.vulcan.attendance_service.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Component
public class AttendanceScheduler {

    private final AttendanceRepository attendanceRepository;
    private final RestTemplate restTemplate;

    @Value("${services.worker.url}")
    private String workerServiceUrl;

    @Value("${services.auth.url}")
    private String authServiceUrl;

    @Value("${services.payroll.url}")
    private String payrollServiceUrl;

    public AttendanceScheduler(AttendanceRepository attendanceRepository, RestTemplate restTemplate) {
        this.attendanceRepository = attendanceRepository;
        this.restTemplate = restTemplate;
    }

    // Runs every day at 11:59 PM - marks workers absent if they didn't clock in
    @Scheduled(cron = "0 59 23 * * *")
    public void markAbsentWorkers() {
        LocalDate today = LocalDate.now();

        try {
            SiteDto[] sites = restTemplate.getForObject(workerServiceUrl + "/api/workers/sites", SiteDto[].class);
            if (sites == null) return;

            for (SiteDto site : sites) {
                SiteAssignmentDto[] assignments = restTemplate.getForObject(
                        workerServiceUrl + "/api/workers/sites/" + site.getId() + "/workers",
                        SiteAssignmentDto[].class);

                if (assignments == null) continue;

                for (SiteAssignmentDto assignment : assignments) {
                    Long workerId = assignment.getWorkerId();

                    Optional<Attendance> existing = attendanceRepository
                            .findByWorkerIdAndAttendanceDate(workerId, today);

                    if (existing.isEmpty()) {
                        Attendance absentRecord = new Attendance();
                        absentRecord.setWorkerId(workerId);
                        absentRecord.setSiteId(site.getId());
                        absentRecord.setStatus(AttendanceStatus.ABSENT);
                        absentRecord.setIsAbsent(true);
                        attendanceRepository.save(absentRecord);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("Error marking absent workers: " + e.getMessage());
        }
    }

    // Runs every day at 12:30 AM - checks for ghost workers (60+ consecutive absent days)
    @Scheduled(cron = "0 30 0 * * *")
    public void checkGhostWorkers() {
        List<Attendance> allAbsences = attendanceRepository.findByStatus(AttendanceStatus.ABSENT);

        // Group by workerId and find consecutive streaks ending today
        allAbsences.stream()
                .map(Attendance::getWorkerId)
                .distinct()
                .forEach(this::checkWorkerConsecutiveAbsences);
    }

    private void checkWorkerConsecutiveAbsences(Long workerId) {
        List<Attendance> records = attendanceRepository.findAllByWorkerIdOrderByAttendanceDateDesc(workerId);

        int consecutiveAbsences = 0;
        LocalDate expectedDate = LocalDate.now();

        for (Attendance record : records) {
            if (record.getAttendanceDate() == null) continue;

            if (record.getAttendanceDate().equals(expectedDate) && record.getStatus() == AttendanceStatus.ABSENT) {
                consecutiveAbsences++;
                expectedDate = expectedDate.minusDays(1);
            } else {
                break;
            }
        }

        if (consecutiveAbsences >= 60) {
            deactivateGhostWorker(workerId);
        }
    }

    private void deactivateGhostWorker(Long workerId) {
        try {
            restTemplate.put(authServiceUrl + "/api/admin/reject/" + workerId, null);
            System.out.println("Worker " + workerId + " deactivated as ghost worker");
        } catch (Exception e) {
            System.out.println("Error deactivating worker " + workerId + ": " + e.getMessage());
        }

        try {
            String currentPeriod = YearMonth.now().toString();
            restTemplate.put(payrollServiceUrl + "/api/payroll/worker/" + workerId + "/exclude?payPeriod=" + currentPeriod, null);
            System.out.println("Worker " + workerId + " excluded from payroll for " + currentPeriod);
        } catch (Exception e) {
            System.out.println("Error excluding worker " + workerId + " from payroll: " + e.getMessage());
        }
    }
}