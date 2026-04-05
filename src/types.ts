export type UserRole = 'admin' | 'faculty' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  institutionalId: string; // Student ID or Faculty ID
  photoURL?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  semester: string;
  department: string;
  facultyIds: string[];
  isActive: boolean;
  coList: string[]; // CO1, CO2, CO3, CO4
  createdAt: string;
}

export interface Note {
  id: string;
  courseId: string;
  facultyId: string;
  title: string;
  description: string;
  pdfUrl: string;
  coMapping: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5';
  createdAt: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  facultyId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  totalMarks: number;
  isPublished: boolean;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  coMapping?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentInstitutionalId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  submittedAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  facultyId: string;
  title: string;
  description: string;
  dueDate: string;
  coMapping: 'Home Assignment' | 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5';
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentInstitutionalId: string;
  pdfUrl: string;
  submittedAt: string;
  status: 'submitted' | 'reviewed';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quiz' | 'note' | 'assignment' | 'result';
  isRead: boolean;
  createdAt: string;
}
