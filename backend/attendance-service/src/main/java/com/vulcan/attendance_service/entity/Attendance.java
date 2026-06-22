package com.vulcan.attendance_service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long workerId;

    @Column(nullable = false)
    private Long siteId;

    private LocalDate attendanceDate;
    private LocalDateTime clockIn;
    private LocalDateTime clockOut;
    private Boolean verifiedByAi;
    private Boolean isAbsent;

    @Enumerated(EnumType.STRING)
    private AttendanceStatus status;

    @PrePersist
    public void prePersist() {
        this.attendanceDate = LocalDate.now();
        this.verifiedByAi = false;
        this.isAbsent = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public LocalDateTime getClockIn() { return clockIn; }
    public void setClockIn(LocalDateTime clockIn) { this.clockIn = clockIn; }
    public LocalDateTime getClockOut() { return clockOut; }
    public void setClockOut(LocalDateTime clockOut) { this.clockOut = clockOut; }
    public Boolean getVerifiedByAi() { return verifiedByAi; }
    public void setVerifiedByAi(Boolean verifiedByAi) { this.verifiedByAi = verifiedByAi; }
    public Boolean getIsAbsent() { return isAbsent; }
    public void setIsAbsent(Boolean isAbsent) { this.isAbsent = isAbsent; }
    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }
}