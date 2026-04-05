package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "courses")
public class Course {
    @Id
    private String id;
    private String title;
    private String code;
    private String description;
    private String semester;
    private String department;
    private boolean isActive;
    private String createdAt;
    
    @ElementCollection
    private List<String> coList;
    
    @ElementCollection
    private List<String> facultyIds;
}
