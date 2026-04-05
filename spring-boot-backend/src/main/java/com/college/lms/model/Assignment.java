package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "assignments")
public class Assignment {
    @Id
    private String id;
    private String title;
    private String description;
    private String deadline;
    private int totalMarks;
    private String coMapping;
    private String fileUrl;
}
