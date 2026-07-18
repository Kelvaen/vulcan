package com.vulcan.payroll_service;

import com.vulcan.payroll_service.repository.PayrollRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class PayrollServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PayrollServiceApplication.class, args);
	}

	// Multi-tenancy migration: payroll records created before companies existed
	// belong to the default demo company (id 1).
	@Bean
	CommandLineRunner backfillPayrollCompany(PayrollRepository repository) {
		return args -> repository.findByCompanyIdIsNull().forEach(r -> {
			r.setCompanyId(1L);
			repository.save(r);
		});
	}
}
