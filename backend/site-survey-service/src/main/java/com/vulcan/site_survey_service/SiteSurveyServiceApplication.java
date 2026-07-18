package com.vulcan.site_survey_service;

import com.vulcan.site_survey_service.repository.SiteSurveyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SiteSurveyServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(SiteSurveyServiceApplication.class, args);
	}

	// Multi-tenancy migration: surveys submitted before companies existed belong
	// to the default demo company (id 1).
	@Bean
	CommandLineRunner backfillSurveyCompany(SiteSurveyRepository repository) {
		return args -> repository.findByCompanyIdIsNull().forEach(s -> {
			s.setCompanyId(1L);
			repository.save(s);
		});
	}
}
