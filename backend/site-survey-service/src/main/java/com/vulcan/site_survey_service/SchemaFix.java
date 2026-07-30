package com.vulcan.site_survey_service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Widens the base64 photo/report columns to TEXT on startup.
 *
 * Hibernate's ddl-auto=update creates missing columns but never changes the
 * type of an existing one. A database first built when these columns were
 * varchar(255) therefore keeps rejecting base64 photos with
 * "ERROR: value too long for type character varying(255)". Running the widen
 * here (idempotent — TEXT to TEXT is a no-op and varchar to TEXT preserves
 * data) makes every environment consistent, old or new.
 */
@Component
public class SchemaFix implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    public SchemaFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        widen("site_surveys", "photo_url");
        widen("site_surveys", "report_text");
    }

    private void widen(String table, String column) {
        try {
            jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + column + " TYPE TEXT");
        } catch (Exception e) {
            System.out.println("Schema widen skipped for " + table + "." + column + ": " + e.getMessage());
        }
    }
}
