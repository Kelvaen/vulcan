package com.vulcan.payroll_service.service;

import com.vulcan.payroll_service.dto.CreatePayrollRequest;
import com.vulcan.payroll_service.entity.PayrollRecord;
import com.vulcan.payroll_service.entity.PayrollStatus;
import com.vulcan.payroll_service.repository.PayrollRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final RestTemplate restTemplate;

    @Value("${services.attendance.url}")
    private String attendanceServiceUrl;

    public PayrollService(PayrollRepository payrollRepository, RestTemplate restTemplate) {
        this.payrollRepository = payrollRepository;
        this.restTemplate = restTemplate;
    }

    public String createPayroll(CreatePayrollRequest request) {
        Optional<PayrollRecord> existing = payrollRepository
                .findByWorkerIdAndPayPeriod(request.getWorkerId(), request.getPayPeriod());
        if (existing.isPresent()) {
            return "Payroll record already exists for this worker and period";
        }

        // Fetch actual days worked from Attendance Service
        Integer daysWorked = request.getDaysWorked();
        try {
            Long presentCount = restTemplate.getForObject(
                    attendanceServiceUrl + "/api/attendance/worker/" + request.getWorkerId()
                            + "/present-count?payPeriod=" + request.getPayPeriod(),
                    Long.class);
            if (presentCount != null) {
                daysWorked = presentCount.intValue();
            }
        } catch (Exception e) {
            System.out.println("Could not fetch attendance data, using provided value: " + e.getMessage());
        }

        PayrollRecord record = new PayrollRecord();
        record.setWorkerId(request.getWorkerId());
        record.setPayPeriod(request.getPayPeriod());
        record.setDaysWorked(daysWorked);

        // Calculate amount based on days worked if a daily rate isn't separately specified
        // For now, use the amount provided, or calculate if amount is null
        Double amount = request.getAmount();
        if (amount == null && daysWorked != null) {
            double dailyRate = 50.0; // default GHS 50/day - adjust as needed
            amount = daysWorked * dailyRate;
        }
        record.setAmount(amount);

        record.setPaymentMethod(request.getPaymentMethod());
        record.setMomoNumber(request.getMomoNumber());
        record.setMomoNetwork(request.getMomoNetwork());
        record.setBankName(request.getBankName());
        record.setAccountNumber(request.getAccountNumber());
        record.setAccountName(request.getAccountName());

        payrollRepository.save(record);
        return "Payroll record created successfully. Days worked: " + daysWorked + ", Amount: " + amount;
    }

    public List<PayrollRecord> getPayrollByPeriod(String payPeriod) {
        return payrollRepository.findByPayPeriod(payPeriod);
    }

    public List<PayrollRecord> getPayrollForWorker(Long workerId) {
        return payrollRepository.findByWorkerId(workerId);
    }

    public String markAsPaid(Long payrollId) {
        Optional<PayrollRecord> recordOpt = payrollRepository.findById(payrollId);
        if (recordOpt.isEmpty()) return "Payroll record not found";

        PayrollRecord record = recordOpt.get();
        record.setStatus(PayrollStatus.PAID);
        record.setProcessedDate(LocalDate.now());
        payrollRepository.save(record);
        return "Payroll marked as paid via " + record.getPaymentMethod();
    }

    public String excludeGhostWorker(Long workerId, String payPeriod) {
        Optional<PayrollRecord> recordOpt = payrollRepository
                .findByWorkerIdAndPayPeriod(workerId, payPeriod);

        if (recordOpt.isEmpty()) return "No payroll record found for this period";

        PayrollRecord record = recordOpt.get();
        record.setStatus(PayrollStatus.EXCLUDED_GHOST_WORKER);
        payrollRepository.save(record);
        return "Worker excluded from payroll due to ghost worker status";
    }
}