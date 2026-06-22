package com.vulcan.equipment_service.controller;

import com.vulcan.equipment_service.dto.EquipmentRequest;
import com.vulcan.equipment_service.dto.UpdateStateRequest;
import com.vulcan.equipment_service.service.EquipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerEquipment(@RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.registerEquipment(request));
    }

    @GetMapping
    public ResponseEntity<?> getAllEquipment() {
        return ResponseEntity.ok(equipmentService.getAllEquipment());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<?> getEquipmentBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(equipmentService.getEquipmentBySite(siteId));
    }

    @PutMapping("/{equipmentId}/state")
    public ResponseEntity<?> updateState(@PathVariable Long equipmentId,
                                         @RequestBody UpdateStateRequest request) {
        return ResponseEntity.ok(equipmentService.updateState(equipmentId, request));
    }
}