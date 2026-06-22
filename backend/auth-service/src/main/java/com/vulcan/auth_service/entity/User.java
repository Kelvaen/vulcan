package com.vulcan.auth_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    private String phoneNumber;
    private String faceImageUrl;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    // Builder
    public static UserBuilder builder() { return new UserBuilder(); }

    public static class UserBuilder {
        private String fullName, email, password, phoneNumber, faceImageUrl;
        private Role role;
        private Status status;

        public UserBuilder fullName(String v) { this.fullName = v; return this; }
        public UserBuilder email(String v) { this.email = v; return this; }
        public UserBuilder password(String v) { this.password = v; return this; }
        public UserBuilder phoneNumber(String v) { this.phoneNumber = v; return this; }
        public UserBuilder faceImageUrl(String v) { this.faceImageUrl = v; return this; }
        public UserBuilder role(Role v) { this.role = v; return this; }
        public UserBuilder status(Status v) { this.status = v; return this; }

        public User build() {
            User u = new User();
            u.fullName = this.fullName;
            u.email = this.email;
            u.password = this.password;
            u.phoneNumber = this.phoneNumber;
            u.faceImageUrl = this.faceImageUrl;
            u.role = this.role;
            u.status = this.status;
            return u;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getFaceImageUrl() { return faceImageUrl; }
    public void setFaceImageUrl(String faceImageUrl) { this.faceImageUrl = faceImageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}