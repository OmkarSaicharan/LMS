package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "quizzes")
public class Quiz {
    @Id
    private String id;
    private String title;
    private String description;
    private String date;
    private String startTime;
    private String endTime;
    private int duration;
    private int totalMarks;
    private String courseId;
    private boolean isPublished;
    
    @Column(columnDefinition = "TEXT")
    private String questions;
}
