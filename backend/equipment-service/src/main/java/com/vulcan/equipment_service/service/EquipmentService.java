package com.vulcan.equipment_service.service;

import com.vulcan.equipment_service.dto.EquipmentRequest;
import com.vulcan.equipment_service.dto.UpdateStateRequest;
import com.vulcan.equipment_service.entity.Equipment;
import com.vulcan.equipment_service.repository.EquipmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public String registerEquipment(EquipmentRequest request) {
        if (equipmentRepository.findByEquipmentCode(request.getEquipmentCode()).isPresent()) {
            return "Equipment code already exists";
        }

        Equipment equipment = new Equipment();
        equipment.setEquipmentCode(request.getEquipmentCode());
        equipment.setName(request.getName());
        equipment.setType(request.getType());
        equipment.setSiteId(request.getSiteId());
        equipmentRepository.save(equipment);
        return "Equipment registered successfully";
    }

    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    public List<Equipment> getEquipmentBySite(Long siteId) {
        return equipmentRepository.findBySiteId(siteId);
    }

    public String updateState(Long equipmentId, UpdateStateRequest request) {
        Optional<Equipment> equipmentOpt = equipmentRepository.findById(equipmentId);
        if (equipmentOpt.isEmpty()) return "Equipment not found";

        Equipment equipment = equipmentOpt.get();
        equipment.setState(request.getState());
        equipmentRepository.save(equipment);
        return "Equipment state updated to " + request.getState();
    }
}