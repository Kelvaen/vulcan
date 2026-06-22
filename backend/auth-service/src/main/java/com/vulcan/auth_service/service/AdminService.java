package com.vulcan.auth_service.service;

import com.vulcan.auth_service.entity.Status;
import com.vulcan.auth_service.entity.User;
import com.vulcan.auth_service.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdminService {

    private final UserRepository userRepository;

    public AdminService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String approveUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return "User not found";
        User user = userOpt.get();
        user.setStatus(Status.ACTIVE);
        userRepository.save(user);
        return "User approved successfully";
    }

    public String rejectUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return "User not found";
        User user = userOpt.get();
        user.setStatus(Status.INACTIVE);
        userRepository.save(user);
        return "User rejected";
    }

    public List<User> getPendingUsers() {
        return userRepository.findByStatus(Status.PENDING);
    }
}