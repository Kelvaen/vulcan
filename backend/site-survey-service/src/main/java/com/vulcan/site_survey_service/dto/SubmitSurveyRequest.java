package com.vulcan.site_survey_service.dto;

public class SubmitSurveyRequest {
    private Long siteId;
    private Long foremanId;
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