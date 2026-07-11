package com.vulcan.attendance_service.controller;

import com.vulcan.attendance_service.dto.ClockInRequest;
import com.vulcan.attendance_service.dto.ClockOutRequest;
import com.vulcan.attendance_service.service.AttendanceService;
import com.vulcan.attendance_service.dto.AiVerificationResult;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    public ResponseEntity<String> clockIn(@Valid @RequestBody ClockInRequest request) {
        return ResponseEntity.ok(attendanceService.clockIn(request));
    }

    @PostMapping("/clock-out")
    public ResponseEntity<String> clockOut(@Valid @RequestBody ClockOutRequest request) {
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
    @PostMapping("/verify-group-photo")
    public ResponseEntity<String> verifyGroupPhoto(
            @RequestParam Long siteId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(attendanceService.verifyGroupPhoto(siteId, file));
    }
    @PostMapping("/update-from-ai")
    public ResponseEntity<String> updateFromAi(@RequestBody AiVerificationResult result) {
        return ResponseEntity.ok(attendanceService.updateAttendanceFromAi(result));
    }
}