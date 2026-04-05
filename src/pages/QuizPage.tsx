import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Quiz, QuizQuestion, QuizAttempt } from '../types';
import { 
  GraduationCap, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  Trash2,
  Loader2,
  Timer,
  Trophy,
  XCircle,
  Calendar,
  Edit2,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin, isFaculty, isStudent } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizState, setQuizState] = useState<'info' | 'attempting' | 'result' | 'editing' | 'results'>('info');
  
  // Attempt state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

  // Edit state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showEditQuizModal, setShowEditQuizModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', quizId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const quizData = { id: docSnap.id, ...docSnap.data() } as Quiz;
        setQuiz(quizData);
        setTimeLeft(quizData.duration * 60);
      }
      setLoading(false);
    };

    fetchQuiz();

    const unsubscribeQuestions = onSnapshot(
      query(collection(db, `quizzes/${quizId}/questions`)),
      (snapshot) => setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizQuestion)))
    );

    let unsubscribeAttempts: () => void = () => {};
    if (isAdmin || isFaculty) {
      unsubscribeAttempts = onSnapshot(
        query(collection(db, 'quizAttempts'), where('quizId', '==', quizId)),
        (snapshot) => setAttempts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt)))
      );
    }

    return () => {
      unsubscribeQuestions();
      unsubscribeAttempts();
    };
  }, [quizId, isAdmin, isFaculty]);

  useEffect(() => {
    let timer: any;
    if (quizState === 'attempting' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const handleStartQuiz = () => {
    if (!quiz) return;
    const now = new Date();
    const quizDate = new Date(quiz.date);
    const [startH, startM] = quiz.startTime.split(':').map(Number);
    const [endH, endM] = quiz.endTime.split(':').map(Number);
    
    const startTime = new Date(quizDate);
    startTime.setHours(startH, startM, 0);
    
    const endTime = new Date(quizDate);
    endTime.setHours(endH, endM, 0);

    if (now < startTime) {
      alert(`Quiz starts at ${quiz.startTime}`);
      return;
    }
    if (now > endTime) {
      alert('Quiz has ended');
      return;
    }

    setQuizState('attempting');
  };

  const handleFinishQuiz = async () => {
    if (!quiz || !profile) return;

    let score = 0;
    let correct = 0;
    let wrong = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswerIndex) {
        correct++;
        score += quiz.totalMarks / questions.length;
      } else {
        wrong++;
      }
    });

    const attempt: Omit<QuizAttempt, 'id'> = {
      quizId: quiz.id,
      quizTitle: quiz.title,
      studentId: profile.uid,
      studentName: profile.displayName,
      studentInstitutionalId: profile.institutionalId || 'N/A',
      score: Math.round(score * 100) / 100,
      totalQuestions: questions.length,
      correctAnswers: correct,
      wrongAnswers: wrong,
      submittedAt: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(collection(db, 'quizAttempts'), attempt);
      
      // Sync with Spring Boot Backend (MySQL)
      try {
        await fetch(`http://localhost:8080/api/quizzes/${quiz.id}/attempts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(attempt)
        });
      } catch (syncErr) {
        console.warn('Failed to sync quiz attempt with local backend:', syncErr);
      }

      setResult({ id: docRef.id, ...attempt });
      setQuizState('result');
    } catch (err) {
      console.error(err);
      alert('Failed to save result');
    }
  };

  const handleAddQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quizId) return;

    const formData = new FormData(e.currentTarget);
    const questionData = {
      question: formData.get('question') as string,
      options: [
        formData.get('option0') as string,
        formData.get('option1') as string,
        formData.get('option2') as string,
        formData.get('option3') as string,
      ],
      correctAnswerIndex: parseInt(formData.get('correctAnswer') as string),
      coMapping: formData.get('coMapping') as string,
      quizId
    };

    try {
      await addDoc(collection(db, `quizzes/${quizId}/questions`), questionData);
      setShowQuestionModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!quizId || !quiz) return;

    setUpdating(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      date: formData.get('date') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      duration: parseInt(formData.get('duration') as string),
      totalMarks: parseInt(formData.get('totalMarks') as string),
    };

    try {
      await updateDoc(doc(db, 'quizzes', quizId), updatedData);
      setQuiz({ ...quiz, ...updatedData });
      setShowEditQuizModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update quiz');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (!quiz) return <div className="text-center p-12">Quiz not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AnimatePresence mode="wait">
        {quizState === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8"
          >
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shrink-0">
                <GraduationCap size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">{quiz.title}</h1>
                <p className="text-slate-500 font-medium">{quiz.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard icon={Calendar} label="Date" value={format(new Date(quiz.date), 'MMM dd, yyyy')} />
              <InfoCard icon={Clock} label="Time" value={`${quiz.startTime} - ${quiz.endTime}`} />
              <InfoCard icon={Timer} label="Duration" value={`${quiz.duration} mins`} />
              <InfoCard icon={Trophy} label="Total Marks" value={quiz.totalMarks.toString()} />
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                Instructions
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                <li>Ensure you have a stable internet connection.</li>
                <li>The quiz will automatically submit when the timer ends.</li>
                <li>Do not refresh the page during the quiz.</li>
                <li>Each question has only one correct answer.</li>
              </ul>
            </div>

            <div className="flex gap-4">
              {isStudent && (
                <button 
                  onClick={handleStartQuiz}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Start Quiz Now
                </button>
              )}
              {(isAdmin || isFaculty) && (
                <>
                  <button 
                    onClick={() => setQuizState('editing')}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Manage Questions ({questions.length})
                  </button>
                  <button 
                    onClick={() => setQuizState('results')}
                    className="flex-1 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-bold hover:bg-indigo-100 transition-all"
                  >
                    View Results ({attempts.length})
                  </button>
                  <button 
                    onClick={() => setShowEditQuizModal(true)}
                    className="p-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                    title="Edit Quiz Details"
                  >
                    <Edit2 size={24} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {quizState === 'attempting' && (
          <motion.div
            key="attempting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 pb-20"
          >
            {/* Quiz Progress Header - Wrapped in a container with background to prevent overlap transparency */}
            <div className="sticky top-[96px] z-30 bg-slate-50 py-4 -mt-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="hidden sm:block">
                    <span className="text-sm font-bold text-slate-500">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <div className="flex-1 max-w-xs h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-300" 
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl font-black text-lg ml-4 shrink-0",
                  timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-indigo-50 text-indigo-600"
                )}>
                  <Timer size={20} />
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] flex flex-col mt-4">
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">
                    Q{currentQuestionIndex + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Knowledge Assessment
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                  {questions[currentQuestionIndex]?.question}
                </h2>
              </div>
              
              <div className="grid gap-4 mt-auto">
                {questions[currentQuestionIndex]?.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [questions[currentQuestionIndex].id]: idx })}
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between group",
                      answers[questions[currentQuestionIndex].id] === idx 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700" 
                        : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm",
                        answers[questions[currentQuestionIndex].id] === idx 
                          ? "bg-indigo-600 text-white" 
                          : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </div>
                    {answers[questions[currentQuestionIndex].id] === idx && <CheckCircle2 size={24} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button 
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                Previous
              </button>
              {currentQuestionIndex === questions.length - 1 ? (
                <button 
                  onClick={handleFinishQuiz}
                  className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                >
                  Submit Quiz
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Next Question
                </button>
              )}
            </div>
          </motion.div>
        )}

        {quizState === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-8"
          >
            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={48} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2">Quiz Completed!</h2>
              <p className="text-slate-500 font-medium">Great job! Here's how you performed.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
              <div className="p-6 bg-indigo-50 rounded-2xl">
                <p className="text-3xl font-black text-indigo-600">{result.score}</p>
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">Score</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-2xl">
                <p className="text-3xl font-black text-emerald-600">{result.correctAnswers}</p>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">Correct</p>
              </div>
              <div className="p-6 bg-red-50 rounded-2xl">
                <p className="text-3xl font-black text-red-600">{result.wrongAnswers}</p>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider mt-1">Wrong</p>
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <button 
                onClick={() => navigate(`/courses/${quiz.courseId}`)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Back to Course
              </button>
              <button 
                onClick={() => setQuizState('info')}
                className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Review Answers
              </button>
            </div>
          </motion.div>
        )}

        {quizState === 'results' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setQuizState('info')}
                className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-2"
              >
                <ChevronRight size={18} className="rotate-180" />
                Back to Info
              </button>
              <h2 className="text-2xl font-black text-slate-900">Quiz Submissions</h2>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Score</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Stats</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attempts.length > 0 ? attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-sm">
                              {attempt.studentName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{attempt.studentName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">ID: {attempt.studentInstitutionalId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-full">
                            {attempt.score} / 100
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {attempt.correctAnswers} Correct
                            </span>
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                              {attempt.wrongAnswers} Wrong
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-500">
                            {format(new Date(attempt.submittedAt), 'MMM dd, hh:mm a')}
                          </p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Trophy className="mx-auto text-slate-200 mb-4" size={48} />
                          <p className="text-slate-500 font-medium">No submissions yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {quizState === 'editing' && (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setQuizState('info')} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                  Back to Quiz Info
                </button>
                <button 
                  onClick={() => setShowEditQuizModal(true)}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                >
                  Edit Quiz Details
                </button>
              </div>
              <button 
                onClick={() => setShowQuestionModal(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus size={20} />
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-bold text-slate-400">Question {i + 1}</span>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">{q.question}</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className={cn(
                        "p-3 rounded-xl border text-sm font-medium",
                        idx === q.correctAnswerIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-600"
                      )}>
                        {opt}
                        {idx === q.correctAnswerIndex && <CheckCircle2 size={14} className="inline ml-2" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Add MCQ Question</h2>
              <button onClick={() => setShowQuestionModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleAddQuestion} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Question Text</label>
                <textarea name="question" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="What is the capital of...?" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Option {String.fromCharCode(65 + i)}</label>
                    <input name={`option${i}`} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder={`Option ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Correct Answer</label>
                  <select name="correctAnswer" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">CO Mapping</label>
                  <select name="coMapping" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="CO1">CO1</option>
                    <option value="CO2">CO2</option>
                    <option value="CO3">CO3</option>
                    <option value="CO4">CO4</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                Save Question
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {showEditQuizModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Edit Quiz Details</h2>
              <button onClick={() => setShowEditQuizModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateQuiz} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Quiz Title</label>
                <input name="title" defaultValue={quiz.title} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea name="description" defaultValue={quiz.description} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input type="date" name="date" defaultValue={quiz.date} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Duration (mins)</label>
                  <input type="number" name="duration" defaultValue={quiz.duration} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Start Time</label>
                  <input type="time" name="startTime" defaultValue={quiz.startTime} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">End Time</label>
                  <input type="time" name="endTime" defaultValue={quiz.endTime} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Total Marks</label>
                <input type="number" name="totalMarks" defaultValue={quiz.totalMarks} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button 
                disabled={updating}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {updating ? <Loader2 className="animate-spin" size={20} /> : 'Update Quiz Details'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const InfoCard: React.FC<{ icon: any, label: string, value: string }> = ({ icon: Icon, label, value }) => (
  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
    <div className="flex items-center gap-2 text-slate-400 mb-1">
      <Icon size={14} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-900">{value}</p>
  </div>
);

export default QuizPage;
