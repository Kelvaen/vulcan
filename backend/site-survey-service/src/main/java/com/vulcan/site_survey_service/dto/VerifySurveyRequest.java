package com.vulcan.site_survey_service.dto;

import com.vulcan.site_survey_service.entity.SurveyStatus;

public class VerifySurveyRequest {
    private Long verifiedBy;
    private SurveyStatus status; // VERIFIED, MISMATCH, or PENALIZED
    private String verificationNotes;

    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }
    public SurveyStatus getStatus() { return status; }
    public void setStatus(SurveyStatus status) { this.status = status; }
    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
}