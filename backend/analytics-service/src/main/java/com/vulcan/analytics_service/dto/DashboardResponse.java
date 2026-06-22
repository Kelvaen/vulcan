package com.vulcan.analytics_service.dto;

import java.util.List;
import java.util.Map;

public class DashboardResponse {
    private Object sites;
    private Object equipment;
    private Object pendingSurveys;
    private Object payrollSummary;
    private String generatedAt;

    public Object getSites() { return sites; }
    public void setSites(Object sites) { this.sites = sites; }
    public Object getEquipment() { return equipment; }
    public void setEquipment(Object equipment) { this.equipment = equipment; }
    public Object getPendingSurveys() { return pendingSurveys; }
    public void setPendingSurveys(Object pendingSurveys) { this.pendingSurveys = pendingSurveys; }
    public Object getPayrollSummary() { return payrollSummary; }
    public void setPayrollSummary(Object payrollSummary) { this.payrollSummary = payrollSummary; }
    public String getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(String generatedAt) { this.generatedAt = generatedAt; }
}