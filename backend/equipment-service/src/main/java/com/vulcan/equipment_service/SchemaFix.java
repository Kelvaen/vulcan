package com.vulcan.equipment_service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Widens the base64 equipment proof-image column to TEXT on startup.
 *
 * Hibernate's ddl-auto=update creates missing columns but never changes the
 * type of an existing one. A database first built when proof_image was a
 * varchar(255) keeps rejecting base64 photos with
 * "ERROR: value too long for type character varying(255)". Running the widen
 * here (idempotent) makes every environment consistent, old or new.
 */
@Component
public class SchemaFix implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public SchemaFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbc.execute("ALTER TABLE equipment ALTER COLUMN proof_image TYPE TEXT");
        } catch (Exception e) {
            System.out.println("Schema widen skipped for equipment.proof_image: " + e.getMessage());
        }
    }
}
