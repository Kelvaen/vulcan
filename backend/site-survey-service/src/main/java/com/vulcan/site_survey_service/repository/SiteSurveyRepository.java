package com.vulcan.site_survey_service.repository;

import com.vulcan.site_survey_service.entity.SiteSurvey;
import com.vulcan.site_survey_service.entity.SurveyStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface SiteSurveyRepository extends JpaRepository<SiteSurvey, Long> {
    List<SiteSurvey> findBySiteIdAndSurveyDate(Long siteId, LocalDate date);
    List<SiteSurvey> findByForemanId(Long foremanId);
    List<SiteSurvey> findByStatus(SurveyStatus status);
    long countByForemanIdAndStatus(Long foremanId, SurveyStatus status);
}