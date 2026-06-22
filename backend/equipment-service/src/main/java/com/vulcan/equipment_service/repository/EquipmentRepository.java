package com.vulcan.equipment_service.repository;

import com.vulcan.equipment_service.entity.Equipment;
import com.vulcan.equipment_service.entity.EquipmentState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findBySiteId(Long siteId);
    List<Equipment> findByState(EquipmentState state);
    Optional<Equipment> findByEquipmentCode(String equipmentCode);
}