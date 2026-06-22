package com.vulcan.site_survey_service.controller;

import com.vulcan.site_survey_service.dto.SubmitSurveyRequest;
import com.vulcan.site_survey_service.dto.VerifySurveyRequest;
import com.vulcan.site_survey_service.entity.SurveyStatus;
import com.vulcan.site_survey_service.service.SiteSurveyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/surveys")
public class SiteSurveyController {

    private final SiteSurveyService siteSurveyService;

    public SiteSurveyController(SiteSurveyService siteSurveyService) {
        this.siteSurveyService = siteSurveyService;
    }

    @PostMapping
    public ResponseEntity<?> submitSurvey(@RequestBody SubmitSurveyRequest request) {
        return ResponseEntity.ok(siteSurveyService.submitSurvey(request));
    }

    @GetMapping("/site/{siteId}/today")
    public ResponseEntity<?> getSurveysForSiteToday(@PathVariable Long siteId) {
        return ResponseEntity.ok(siteSurveyService.getSurveysForSiteToday(siteId));
    }

    @GetMapping("/foreman/{foremanId}")
    public ResponseEntity<?> getSurveysByForeman(@PathVariable Long foremanId) {
        return ResponseEntity.ok(siteSurveyService.getSurveysByForeman(foremanId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<?> getSurveysByStatus(@PathVariable SurveyStatus status) {
        return ResponseEntity.ok(siteSurveyService.getSurveysByStatus(status));
    }

    @PutMapping("/{surveyId}/verify")
    public ResponseEntity<?> verifySurvey(@PathVariable Long surveyId, @RequestBody VerifySurveyRequest request) {
        return ResponseEntity.ok(siteSurveyService.verifySurvey(surveyId, request));
    }

    @GetMapping("/foreman/{foremanId}/penalties")
    public ResponseEntity<?> countPenalties(@PathVariable Long foremanId) {
        return ResponseEntity.ok(siteSurveyService.countPenalties(foremanId));
    }
}