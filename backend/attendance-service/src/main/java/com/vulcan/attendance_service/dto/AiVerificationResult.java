package com.vulcan.attendance_service.dto;

import java.util.List;

public class AiVerificationResult {
    private Long siteId;
    private List<Long> present;
    private List<Long> absent;

    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public List<Long> getPresent() { return present; }
    public void setPresent(List<Long> present) { this.present = present; }
    public List<Long> getAbsent() { return absent; }
    public void setAbsent(List<Long> absent) { this.absent = absent; }
}