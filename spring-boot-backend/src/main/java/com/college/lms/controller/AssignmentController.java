package com.college.lms.controller;

import com.college.lms.model.Assignment;
import com.college.lms.model.Submission;
import com.college.lms.repository.AssignmentRepository;
import com.college.lms.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @GetMapping
    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    @PostMapping
    public Assignment createAssignment(@RequestBody Assignment assignment) {
        return assignmentRepository.save(assignment);
    }

    @GetMapping("/{id}")
    public Assignment getAssignment(@PathVariable String id) {
        return assignmentRepository.findById(id).orElse(null);
    }

    @PostMapping("/{id}/submissions")
    public Submission submitAssignment(@PathVariable String id, @RequestBody Submission submission) {
        submission.setAssignmentId(id);
        return submissionRepository.save(submission);
    }

    @GetMapping("/{id}/submissions")
    public List<Submission> getSubmissions(@PathVariable String id) {
        return submissionRepository.findByAssignmentId(id);
    }
}
