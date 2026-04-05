package com.college.lms.repository;

import com.college.lms.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByQuizId(String quizId);
    List<QuizAttempt> findByStudentId(String studentId);
    List<QuizAttempt> findAllByOrderBySubmittedAtDesc();
}
