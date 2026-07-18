package com.vulcan.site_survey_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "site_surveys")
public class SiteSurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long siteId;
    private Long companyId;

    @Column(nullable = false)
    private Long foremanId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reportText;

    // Holds either a URL or a base64 data URI of the daily-report photo.
    @Column(columnDefinition = "TEXT")
    private String photoUrl;

    private LocalDate surveyDate;

    @Enumerated(EnumType.STRING)
    private SurveyStatus status;

    // Verification fields
    private Long verifiedBy; // supervisor's user id
    private String verificationNotes;
    private LocalDateTime verifiedAt;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.surveyDate = LocalDate.now();
        this.status = SurveyStatus.SUBMITTED;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public Long getForemanId() { return foremanId; }
    public void setForemanId(Long foremanId) { this.foremanId = foremanId; }
    public String getReportText() { return reportText; }
    public void setReportText(String reportText) { this.reportText = reportText; }
    // Kept out of list responses (base64 photos are huge) — fetched on demand
    // via GET /api/surveys/{id}/photo. Clients read "hasPhoto" instead.
    @JsonIgnore
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public boolean isHasPhoto() {
        return photoUrl != null && photoUrl.startsWith("data:");
    }
    public LocalDate getSurveyDate() { return surveyDate; }
    public SurveyStatus getStatus() { return status; }
    public void setStatus(SurveyStatus status) { this.status = status; }
    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }
    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}