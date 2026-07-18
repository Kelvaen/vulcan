package com.vulcan.worker_service;

import com.vulcan.worker_service.repository.SiteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class WorkerServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(WorkerServiceApplication.class, args);
	}

	// Multi-tenancy migration: sites created before companies existed belong to
	// the default demo company (id 1).
	@Bean
	CommandLineRunner backfillSiteCompany(SiteRepository siteRepository) {
		return args -> siteRepository.findByCompanyIdIsNull().forEach(s -> {
			s.setCompanyId(1L);
			siteRepository.save(s);
		});
	}
}
