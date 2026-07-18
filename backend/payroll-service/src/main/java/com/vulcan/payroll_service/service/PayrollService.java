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
    private final PaystackTransferService paystackTransferService;

    @Value("${services.attendance.url}")
    private String attendanceServiceUrl;

    public PayrollService(PayrollRepository payrollRepository, RestTemplate restTemplate,
                          PaystackTransferService paystackTransferService) {
        this.payrollRepository = payrollRepository;
        this.restTemplate = restTemplate;
        this.paystackTransferService = paystackTransferService;
    }

    public String createPayroll(CreatePayrollRequest request, Long companyId) {
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
        record.setCompanyId(companyId);
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

    public List<PayrollRecord> getPayrollByPeriod(String payPeriod, Long companyId) {
        return companyId == null ? payrollRepository.findByPayPeriod(payPeriod)
                : payrollRepository.findByPayPeriodAndCompanyId(payPeriod, companyId);
    }

    public List<PayrollRecord> getPayrollForWorker(Long workerId) {
        return payrollRepository.findByWorkerId(workerId);
    }

    public String markAsPaid(Long payrollId) {
        Optional<PayrollRecord> recordOpt = payrollRepository.findById(payrollId);
        if (recordOpt.isEmpty()) return "Payroll record not found";

        PayrollRecord record = recordOpt.get();
        if (record.getStatus() == PayrollStatus.PAID) {
            return "Payroll already paid";
        }

        // Mobile-money methods are paid out through Paystack; bank/cheque are settled manually.
        boolean isMomo = PaystackTransferService.bankCode(record.getPaymentMethod()) != null;
        if (isMomo && record.getMomoNumber() != null && !record.getMomoNumber().isBlank()) {
            String name = record.getAccountName() != null && !record.getAccountName().isBlank()
                    ? record.getAccountName()
                    : "Worker " + record.getWorkerId();
            PaystackTransferService.Result result = paystackTransferService.payout(
                    name, record.getMomoNumber(), record.getPaymentMethod(),
                    record.getAmount() == null ? 0 : record.getAmount());
            if (!result.success) {
                record.setStatus(PayrollStatus.FAILED);
                payrollRepository.save(record);
                return "Mobile money payout failed: " + result.message;
            }
            record.setStatus(PayrollStatus.PAID);
            record.setProcessedDate(LocalDate.now());
            payrollRepository.save(record);
            return "Paid to mobile money — " + result.message;
        }

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