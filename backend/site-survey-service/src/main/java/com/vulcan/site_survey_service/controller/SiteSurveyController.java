package com.vulcan.site_survey_service.controller;

import com.vulcan.site_survey_service.dto.SubmitSurveyRequest;
import com.vulcan.site_survey_service.dto.VerifySurveyRequest;
import com.vulcan.site_survey_service.entity.SurveyStatus;
import com.vulcan.site_survey_service.service.SiteSurveyService;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> submitSurvey(@Valid @RequestBody SubmitSurveyRequest request,
                                          @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(siteSurveyService.submitSurvey(request, companyId));
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
    public ResponseEntity<?> getSurveysByStatus(@PathVariable SurveyStatus status,
                                                @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(siteSurveyService.getSurveysByStatus(status, companyId));
    }

    @PutMapping("/{surveyId}/verify")
    public ResponseEntity<?> verifySurvey(@PathVariable Long surveyId,
                                          @RequestBody VerifySurveyRequest request) {
        return ResponseEntity.ok(siteSurveyService.verifySurvey(surveyId, request));
    }

    @GetMapping("/foreman/{foremanId}/penalties")
    public ResponseEntity<?> countPenalties(@PathVariable Long foremanId) {
        return ResponseEntity.ok(siteSurveyService.countPenalties(foremanId));
    }

    @GetMapping("/{surveyId}/photo")
    public ResponseEntity<?> getPhoto(@PathVariable Long surveyId) {
        String photo = siteSurveyService.getPhoto(surveyId);
        if (photo == null || !photo.startsWith("data:")) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(java.util.Map.of("photoUrl", photo));
    }
}