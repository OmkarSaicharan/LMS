package com.college.lms.controller;

import com.college.lms.model.User;
import com.college.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public User saveUser(@RequestBody User user) {
        return userRepository.save(user);
    }

    @GetMapping("/{uid}")
    public User getUser(@PathVariable String uid) {
        return userRepository.findById(uid).orElse(null);
    }
}
