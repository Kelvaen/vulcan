package com.vulcan.attendance_service.controller;

import com.vulcan.attendance_service.dto.ClockInRequest;
import com.vulcan.attendance_service.dto.ClockOutRequest;
import com.vulcan.attendance_service.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<String> clockIn(@RequestBody ClockInRequest request) {
        return ResponseEntity.ok(attendanceService.clockIn(request));
    }

    @PostMapping("/clock-out")
    public ResponseEntity<String> clockOut(@RequestBody ClockOutRequest request) {
        return ResponseEntity.ok(attendanceService.clockOut(request));
    }

    @GetMapping("/ghost-check/{workerId}")
    public ResponseEntity<String> checkGhostWorker(@PathVariable Long workerId) {
        return ResponseEntity.ok(attendanceService.checkGhostWorker(workerId));
    }

    @GetMapping("/worker/{workerId}/present-count")
    public ResponseEntity<Long> getPresentCount(@PathVariable Long workerId, @RequestParam String payPeriod) {
        return ResponseEntity.ok(attendanceService.getPresentCountForPeriod(workerId, payPeriod));
    }
}