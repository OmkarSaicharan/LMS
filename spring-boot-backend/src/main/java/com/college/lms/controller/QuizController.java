package com.college.lms.controller;

import com.college.lms.model.Quiz;
import com.college.lms.model.QuizAttempt;
import com.college.lms.repository.QuizAttemptRepository;
import com.college.lms.repository.QuizRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository attemptRepository;

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    @PostMapping
    public Quiz createQuiz(@RequestBody Quiz quiz) {
        return quizRepository.save(quiz);
    }

    @GetMapping("/{id}")
    public Quiz getQuiz(@PathVariable Long id) {
        return quizRepository.findById(id).orElse(null);
    }

    @PostMapping("/{id}/attempts")
    public QuizAttempt submitAttempt(@PathVariable Long id, @RequestBody QuizAttempt attempt) {
        attempt.setQuizId(id);
        return attemptRepository.save(attempt);
    }

    @GetMapping("/{id}/attempts")
    public List<QuizAttempt> getQuizAttempts(@PathVariable Long id) {
        return attemptRepository.findByQuizId(id);
    }
}
