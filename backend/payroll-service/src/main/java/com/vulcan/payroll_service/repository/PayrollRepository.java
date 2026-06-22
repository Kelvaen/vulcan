package com.vulcan.payroll_service.repository;

import com.vulcan.payroll_service.entity.PayrollRecord;
import com.vulcan.payroll_service.entity.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<PayrollRecord, Long> {
    List<PayrollRecord> findByPayPeriod(String payPeriod);
    List<PayrollRecord> findByWorkerId(Long workerId);
    Optional<PayrollRecord> findByWorkerIdAndPayPeriod(Long workerId, String payPeriod);
    List<PayrollRecord> findByStatus(PayrollStatus status);
}