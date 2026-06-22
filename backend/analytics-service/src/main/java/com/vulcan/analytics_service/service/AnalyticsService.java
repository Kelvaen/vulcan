package com.vulcan.analytics_service.service;

import com.vulcan.analytics_service.dto.DashboardResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
public class AnalyticsService {

    private final RestTemplate restTemplate;

    @Value("${services.worker.url}")
    private String workerServiceUrl;

    @Value("${services.equipment.url}")
    private String equipmentServiceUrl;

    @Value("${services.survey.url}")
    private String surveyServiceUrl;

    @Value("${services.payroll.url}")
    private String payrollServiceUrl;

    public AnalyticsService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public DashboardResponse getDashboard(String payPeriod) {
        DashboardResponse response = new DashboardResponse();

        try {
            Object sites = restTemplate.getForObject(workerServiceUrl + "/api/workers/sites", Object.class);
            response.setSites(sites);
        } catch (Exception e) {
            response.setSites("Unable to fetch sites: " + e.getMessage());
        }

        try {
            Object equipment = restTemplate.getForObject(equipmentServiceUrl + "/api/equipment", Object.class);
            response.setEquipment(equipment);
        } catch (Exception e) {
            response.setEquipment("Unable to fetch equipment: " + e.getMessage());
        }

        try {
            Object surveys = restTemplate.getForObject(surveyServiceUrl + "/api/surveys/status/SUBMITTED", Object.class);
            response.setPendingSurveys(surveys);
        } catch (Exception e) {
            response.setPendingSurveys("Unable to fetch surveys: " + e.getMessage());
        }

        try {
            Object payroll = restTemplate.getForObject(payrollServiceUrl + "/api/payroll/period/" + payPeriod, Object.class);
            response.setPayrollSummary(payroll);
        } catch (Exception e) {
            response.setPayrollSummary("Unable to fetch payroll: " + e.getMessage());
        }

        response.setGeneratedAt(LocalDateTime.now().toString());
        return response;
    }
}