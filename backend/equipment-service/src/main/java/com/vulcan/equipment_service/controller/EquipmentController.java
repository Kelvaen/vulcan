package com.vulcan.equipment_service.controller;

import com.vulcan.equipment_service.dto.EquipmentRequest;
import com.vulcan.equipment_service.dto.UpdateStateRequest;
import com.vulcan.equipment_service.service.EquipmentService;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> registerEquipment(@Valid @RequestBody EquipmentRequest request,
                                               @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(equipmentService.registerEquipment(request, companyId));
    }

    @GetMapping
    public ResponseEntity<?> getAllEquipment(
            @RequestAttribute(name = "companyId", required = false) Long companyId) {
        return ResponseEntity.ok(equipmentService.getAllEquipment(companyId));
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

    @GetMapping("/{equipmentId}/proof")
    public ResponseEntity<?> getProof(@PathVariable Long equipmentId) {
        String proof = equipmentService.getProof(equipmentId);
        if (proof == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(java.util.Map.of("proofImage", proof));
    }
}