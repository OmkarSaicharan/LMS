package com.college.lms.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long assignmentId;
    private String studentId;
    private String studentName;
    private String studentInstitutionalId;
    private String pdfUrl;
    private String submittedAt;
    private String status;
}
