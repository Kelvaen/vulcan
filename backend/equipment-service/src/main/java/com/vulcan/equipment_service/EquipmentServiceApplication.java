package com.vulcan.equipment_service;

import com.vulcan.equipment_service.repository.EquipmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class EquipmentServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EquipmentServiceApplication.class, args);
	}

	// Multi-tenancy migration: equipment registered before companies existed
	// belongs to the default demo company (id 1).
	@Bean
	CommandLineRunner backfillEquipmentCompany(EquipmentRepository equipmentRepository) {
		return args -> equipmentRepository.findByCompanyIdIsNull().forEach(e -> {
			e.setCompanyId(1L);
			equipmentRepository.save(e);
		});
	}
}
