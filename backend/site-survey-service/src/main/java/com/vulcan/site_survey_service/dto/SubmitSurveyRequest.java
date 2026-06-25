package com.vulcan.site_survey_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class SubmitSurveyRequest {
    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    private Long siteId;

    @NotNull(message = "Foreman ID is required")
    @Positive(message = "Foreman ID must be positive")
    private Long foremanId;

    @NotBlank(message = "Report text is required")
    private String reportText;

    private String photoUrl;

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public Long getForemanId() { return foremanId; }
    public void setForemanId(Long foremanId) { this.foremanId = foremanId; }
    public String getReportText() { return reportText; }
    public void setReportText(String reportText) { this.reportText = reportText; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
}