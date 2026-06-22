package com.vulcan.worker_service.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "site_assignments")
public class SiteAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long workerId;

    @ManyToOne
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    private LocalDate assignedDate;

    @PrePersist
    public void prePersist() {
        this.assignedDate = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public Site getSite() { return site; }
    public void setSite(Site site) { this.site = site; }
    public LocalDate getAssignedDate() { return assignedDate; }
}