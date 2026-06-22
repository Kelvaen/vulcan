package com.vulcan.equipment_service.dto;

import com.vulcan.equipment_service.entity.EquipmentState;

public class UpdateStateRequest {
    private EquipmentState state;

    public EquipmentState getState() { return state; }
    public void setState(EquipmentState state) { this.state = state; }
}