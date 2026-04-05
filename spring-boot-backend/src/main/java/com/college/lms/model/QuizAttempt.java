package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long quizId;
    private String quizTitle;
    private String studentId;
    private String studentName;
    private String studentInstitutionalId;
    private double score;
    private int totalQuestions;
    private int correctAnswers;
    private int wrongAnswers;
    private String submittedAt;
}
