package com.vulcan.equipment_service.dto;

import com.vulcan.equipment_service.entity.EquipmentState;

public class UpdateStateRequest {
    private EquipmentState state;
    private String proofImage; // optional base64 data URI photo proof

    public EquipmentState getState() { return state; }
    public void setState(EquipmentState state) { this.state = state; }
    public String getProofImage() { return proofImage; }
    public void setProofImage(String proofImage) { this.proofImage = proofImage; }
}