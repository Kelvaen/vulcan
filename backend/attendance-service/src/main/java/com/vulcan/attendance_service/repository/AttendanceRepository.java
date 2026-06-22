package com.vulcan.attendance_service.repository;

import com.vulcan.attendance_service.entity.Attendance;
import com.vulcan.attendance_service.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByWorkerIdAndAttendanceDate(Long workerId, LocalDate date);
    List<Attendance> findByWorkerIdAndStatus(Long workerId, AttendanceStatus status);
    List<Attendance> findBySiteIdAndAttendanceDate(Long siteId, LocalDate date);
    long countByWorkerIdAndStatus(Long workerId, AttendanceStatus status);
    List<Attendance> findByStatus(AttendanceStatus status);
    List<Attendance> findAllByWorkerIdOrderByAttendanceDateDesc(Long workerId);
}