package com.vulcan.equipment_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String equipmentCode;

    @Column(nullable = false)
    private String name;

    private String type;
    private Long siteId;
    private Long companyId;

    @Enumerated(EnumType.STRING)
    private EquipmentState state;

    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;

    // Photo proof of the asset's condition (base64 data URI). Kept out of list
    // responses to avoid bloat — fetched on demand via /{id}/proof.
    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    private String proofImage;

    private LocalDateTime proofUpdatedAt;

    @PrePersist
    public void prePersist() {
        this.registeredAt = LocalDateTime.now();
        this.state = EquipmentState.AVAILABLE;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getEquipmentCode() { return equipmentCode; }
    public void setEquipmentCode(String equipmentCode) { this.equipmentCode = equipmentCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public EquipmentState getState() { return state; }
    public void setState(EquipmentState state) { this.state = state; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    @JsonIgnore
    public String getProofImage() { return proofImage; }
    public void setProofImage(String proofImage) { this.proofImage = proofImage; }
    public LocalDateTime getProofUpdatedAt() { return proofUpdatedAt; }
    public void setProofUpdatedAt(LocalDateTime proofUpdatedAt) { this.proofUpdatedAt = proofUpdatedAt; }

    // Serialized as "hasProof" so clients can show a proof badge without downloading the image.
    public boolean isHasProof() { return proofImage != null && !proofImage.isBlank(); }
}