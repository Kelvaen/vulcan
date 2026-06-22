package com.vulcan.payroll_service.controller;

import com.vulcan.payroll_service.dto.CreatePayrollRequest;
import com.vulcan.payroll_service.service.PayrollService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payroll")
public class PayrollController {

    private final PayrollService payrollService;

    public PayrollController(PayrollService payrollService) {
        this.payrollService = payrollService;
    }

    @PostMapping
    public ResponseEntity<?> createPayroll(@RequestBody CreatePayrollRequest request) {
        return ResponseEntity.ok(payrollService.createPayroll(request));
    }

    @GetMapping("/period/{payPeriod}")
    public ResponseEntity<?> getPayrollByPeriod(@PathVariable String payPeriod) {
        return ResponseEntity.ok(payrollService.getPayrollByPeriod(payPeriod));
    }

    @GetMapping("/worker/{workerId}")
    public ResponseEntity<?> getPayrollForWorker(@PathVariable Long workerId) {
        return ResponseEntity.ok(payrollService.getPayrollForWorker(workerId));
    }

    @PutMapping("/{payrollId}/pay")
    public ResponseEntity<?> markAsPaid(@PathVariable Long payrollId) {
        return ResponseEntity.ok(payrollService.markAsPaid(payrollId));
    }

    @PutMapping("/worker/{workerId}/exclude")
    public ResponseEntity<?> excludeGhostWorker(@PathVariable Long workerId, @RequestParam String payPeriod) {
        return ResponseEntity.ok(payrollService.excludeGhostWorker(workerId, payPeriod));
    }
}