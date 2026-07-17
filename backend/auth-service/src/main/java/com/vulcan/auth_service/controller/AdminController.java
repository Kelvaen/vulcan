package com.vulcan.auth_service.controller;

import com.vulcan.auth_service.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PutMapping("/approve/{userId}")
    public ResponseEntity<String> approveUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.approveUser(userId));
    }

    @PutMapping("/reject/{userId}")
    public ResponseEntity<String> rejectUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.rejectUser(userId));
    }

    @PutMapping("/remove/{userId}")
    public ResponseEntity<String> removeUser(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.removeUser(userId));
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPendingUsers(@RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(adminService.getPendingUsers(companyId));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getActiveUsers(@RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(adminService.getActiveUsers(companyId));
    }
}