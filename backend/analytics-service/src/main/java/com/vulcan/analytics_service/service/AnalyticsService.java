package com.vulcan.analytics_service.service;

import com.vulcan.analytics_service.dto.DashboardResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
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

    public DashboardResponse getDashboard(String payPeriod, String authHeader) {
        DashboardResponse response = new DashboardResponse();

        // Forward the caller's token so each service scopes its data to the
        // caller's company (companyId is read from the signed token).
        HttpHeaders headers = new HttpHeaders();
        if (authHeader != null) headers.set("Authorization", authHeader);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        try {
            response.setSites(get(workerServiceUrl + "/api/workers/sites", entity));
        } catch (Exception e) {
            response.setSites("Unable to fetch sites: " + e.getMessage());
        }

        try {
            response.setEquipment(get(equipmentServiceUrl + "/api/equipment", entity));
        } catch (Exception e) {
            response.setEquipment("Unable to fetch equipment: " + e.getMessage());
        }

        try {
            response.setPendingSurveys(get(surveyServiceUrl + "/api/surveys/status/SUBMITTED", entity));
        } catch (Exception e) {
            response.setPendingSurveys("Unable to fetch surveys: " + e.getMessage());
        }

        try {
            response.setPayrollSummary(get(payrollServiceUrl + "/api/payroll/period/" + payPeriod, entity));
        } catch (Exception e) {
            response.setPayrollSummary("Unable to fetch payroll: " + e.getMessage());
        }

        response.setGeneratedAt(LocalDateTime.now().toString());
        return response;
    }

    private Object get(String url, HttpEntity<Void> entity) {
        return restTemplate.exchange(url, HttpMethod.GET, entity, Object.class).getBody();
    }
}