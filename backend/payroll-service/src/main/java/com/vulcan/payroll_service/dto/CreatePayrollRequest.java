package com.vulcan.payroll_service.dto;

import com.vulcan.payroll_service.entity.PaymentMethod;

public class CreatePayrollRequest {
    private Long workerId;
    private String payPeriod;
    private Double amount;
    private Integer daysWorked;
    private PaymentMethod paymentMethod;

    // Mobile money
    private String momoNumber;
    private String momoNetwork;

    // Bank
    private String bankName;
    private String accountNumber;
    private String accountName;

    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public String getPayPeriod() { return payPeriod; }
    public void setPayPeriod(String payPeriod) { this.payPeriod = payPeriod; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public Integer getDaysWorked() { return daysWorked; }
    public void setDaysWorked(Integer daysWorked) { this.daysWorked = daysWorked; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getMomoNumber() { return momoNumber; }
    public void setMomoNumber(String momoNumber) { this.momoNumber = momoNumber; }
    public String getMomoNetwork() { return momoNetwork; }
    public void setMomoNetwork(String momoNetwork) { this.momoNetwork = momoNetwork; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
}