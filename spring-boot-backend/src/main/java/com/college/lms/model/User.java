package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    private String uid;
    private String email;
    private String role;
    private String displayName;
    private String institutionalId;
    private LocalDateTime createdAt;
    private boolean isActive;
}
