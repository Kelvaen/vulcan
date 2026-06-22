package com.vulcan.site_survey_service.service;

import com.vulcan.site_survey_service.dto.SubmitSurveyRequest;
import com.vulcan.site_survey_service.dto.VerifySurveyRequest;
import com.vulcan.site_survey_service.entity.SiteSurvey;
import com.vulcan.site_survey_service.entity.SurveyStatus;
import com.vulcan.site_survey_service.repository.SiteSurveyRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SiteSurveyService {

    private final SiteSurveyRepository siteSurveyRepository;

    public SiteSurveyService(SiteSurveyRepository siteSurveyRepository) {
        this.siteSurveyRepository = siteSurveyRepository;
    }

    public String submitSurvey(SubmitSurveyRequest request) {
        SiteSurvey survey = new SiteSurvey();
        survey.setSiteId(request.getSiteId());
        survey.setForemanId(request.getForemanId());
        survey.setReportText(request.getReportText());
        survey.setPhotoUrl(request.getPhotoUrl());
        siteSurveyRepository.save(survey);
        return "Survey report submitted successfully";
    }

    public List<SiteSurvey> getSurveysForSiteToday(Long siteId) {
        return siteSurveyRepository.findBySiteIdAndSurveyDate(siteId, LocalDate.now());
    }

    public List<SiteSurvey> getSurveysByForeman(Long foremanId) {
        return siteSurveyRepository.findByForemanId(foremanId);
    }

    public List<SiteSurvey> getSurveysByStatus(SurveyStatus status) {
        return siteSurveyRepository.findByStatus(status);
    }

    public String verifySurvey(Long surveyId, VerifySurveyRequest request) {
        Optional<SiteSurvey> surveyOpt = siteSurveyRepository.findById(surveyId);
        if (surveyOpt.isEmpty()) return "Survey not found";

        SiteSurvey survey = surveyOpt.get();
        survey.setStatus(request.getStatus());
        survey.setVerifiedBy(request.getVerifiedBy());
        survey.setVerificationNotes(request.getVerificationNotes());
        survey.setVerifiedAt(LocalDateTime.now());

        siteSurveyRepository.save(survey);

        if (request.getStatus() == SurveyStatus.PENALIZED) {
            return "Survey verified — mismatch found, foreman penalized";
        }
        return "Survey verified successfully — status: " + request.getStatus();
    }

    public long countPenalties(Long foremanId) {
        return siteSurveyRepository.countByForemanIdAndStatus(foremanId, SurveyStatus.PENALIZED);
    }
}