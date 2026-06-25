package com.vulcan.equipment_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class EquipmentRequest {
    @NotBlank(message = "Equipment code is required")
    private String equipmentCode;

    @NotBlank(message = "Equipment name is required")
    private String name;

    private String type;

    @NotNull(message = "Site ID is required")
    @Positive(message = "Site ID must be positive")
    private Long siteId;

    public String getEquipmentCode() { return equipmentCode; }
    public void setEquipmentCode(String equipmentCode) { this.equipmentCode = equipmentCode; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getSiteId() { return siteId; }
    public void setSiteId(Long siteId) { this.siteId = siteId; }
}