import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Course, Note, Quiz, Assignment, UserProfile } from '../types';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Plus, 
  Download, 
  Trash2, 
  ChevronRight, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile, isAdmin, isFaculty, isStudent } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'notes' | 'quizzes' | 'assignments'>('notes');
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      const docRef = doc(db, 'courses', courseId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
      }
      setLoading(false);
    };

    fetchCourse();

    const unsubscribeNotes = onSnapshot(
      query(collection(db, 'notes'), where('courseId', '==', courseId)),
      (snapshot) => setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)))
    );

    const unsubscribeQuizzes = onSnapshot(
      query(collection(db, 'quizzes'), where('courseId', '==', courseId)),
      (snapshot) => setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz)))
    );

    const unsubscribeAssignments = onSnapshot(
      query(collection(db, 'assignments'), where('courseId', '==', courseId)),
      (snapshot) => setAssignments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)))
    );

    return () => {
      unsubscribeNotes();
      unsubscribeQuizzes();
      unsubscribeAssignments();
    };
  }, [courseId]);

  const handleCreateQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseId || !profile) return;
    
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const quizData = {
        courseId,
        facultyId: profile.uid,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        duration: parseInt(formData.get('duration') as string),
        totalMarks: parseInt(formData.get('totalMarks') as string),
        isPublished: true,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'quizzes'), quizData);

      // Notify students
      await addDoc(collection(db, 'notifications'), {
        userId: 'all_students',
        title: 'New Quiz Scheduled',
        message: `A new quiz "${quizData.title}" has been scheduled for ${quizData.date} in ${course?.title}.`,
        type: 'quiz',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      setShowQuizModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create quiz');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseId || !profile) return;
    
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const assignmentData = {
        courseId,
        facultyId: profile.uid,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        dueDate: formData.get('dueDate') as string,
        coMapping: formData.get('coMapping') as any,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'assignments'), assignmentData);

      // Notify students
      await addDoc(collection(db, 'notifications'), {
        userId: 'all_students',
        title: 'New Assignment Posted',
        message: `A new assignment "${assignmentData.title}" has been posted for ${course?.title}.`,
        type: 'assignment',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      setShowAssignmentModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create assignment');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!courseId || !profile) return;
    
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const coMapping = formData.get('coMapping') as any;

    try {
      const storageRef = ref(storage, `notes/${courseId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'notes'), {
        courseId,
        facultyId: profile.uid,
        title,
        description,
        pdfUrl,
        coMapping,
        createdAt: new Date().toISOString()
      });

      // Notify students
      await addDoc(collection(db, 'notifications'), {
        userId: 'all_students', // Simplified for demo
        title: 'New Notes Uploaded',
        message: `New notes for ${course?.title} have been uploaded: ${title}`,
        type: 'note',
        isRead: false,
        createdAt: new Date().toISOString()
      });

      setShowUploadModal(false);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (!course) return <div className="text-center p-12">Course not found</div>;

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <header className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {course.code}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                {course.semester} • {course.department}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900">{course.title}</h1>
            <p className="text-slate-600 max-w-2xl leading-relaxed">{course.description}</p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {course.coList.map((co) => (
                <span key={co} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100">
                  {co}
                </span>
              ))}
            </div>
          </div>
          
          {(isAdmin || isFaculty) && (
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                <Upload size={20} />
                Upload Notes
              </button>
              <button 
                onClick={() => setShowQuizModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                <Plus size={20} />
                Create Quiz
              </button>
              <button 
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                <BookOpen size={20} />
                New Assignment
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm w-fit">
        {[
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'quizzes', label: 'Quizzes', icon: GraduationCap },
          { id: 'assignments', label: 'Assignments', icon: BookOpen }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid gap-6">
        <AnimatePresence mode="wait">
          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {notes.length > 0 ? notes.map((note) => (
                <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100">
                      {note.coMapping}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{note.title}</h3>
                  <p className="text-xs text-slate-500 mb-6 line-clamp-2">{note.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {format(new Date(note.createdAt), 'MMM dd, yyyy')}
                    </span>
                    <a 
                      href={note.pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold transition-all"
                    >
                      <Download size={14} />
                      Download
                    </a>
                  </div>
                </div>
              )) : (
                <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                  <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium">No notes uploaded yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'quizzes' && (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {quizzes.length > 0 ? quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <GraduationCap size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{quiz.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium mt-1">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {format(new Date(quiz.date), 'MMM dd, yyyy')}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {quiz.startTime} - {quiz.endTime}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {quiz.duration} mins</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isStudent && (
                      <Link 
                        to={`/quizzes/${quiz.id}`}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                      >
                        Attempt Quiz
                      </Link>
                    )}
                    {(isAdmin || isFaculty) && (
                      <>
                        <Link 
                          to={`/quizzes/${quiz.id}`}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                          Manage
                        </Link>
                        <button className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <Trash2 size={20} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                  <GraduationCap className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium">No quizzes scheduled.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'assignments' && (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {assignments.length > 0 ? assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <BookOpen size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-900">{assignment.title}</h3>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg border border-amber-100">
                          {assignment.coMapping}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1 text-red-600"><AlertCircle size={14} /> Due: {format(new Date(assignment.dueDate), 'MMM dd, hh:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link 
                      to={`/assignments/${assignment.id}`}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                      {isStudent ? 'Submit Assignment' : 'Review Submissions'}
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                  <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium">No assignments posted.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Upload Course Notes</h2>
                <button onClick={() => setShowUploadModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleFileUpload} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Title</label>
                  <input name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Unit 1: Introduction to LMS" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea name="description" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="Brief overview of the notes..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">CO Mapping</label>
                    <select name="coMapping" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                      {course.coList.map(co => <option key={co} value={co}>{co}</option>)}
                      <option value="CO5">CO5</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">PDF File</label>
                    <input type="file" name="file" accept=".pdf" required className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                  </div>
                </div>
                <button 
                  disabled={uploading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Start Upload'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showQuizModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New Quiz</h2>
                <button onClick={() => setShowQuizModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateQuiz} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Quiz Title</label>
                  <input name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mid-Term Assessment" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea name="description" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="Instructions for the quiz..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Date</label>
                    <input type="date" name="date" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Duration (mins)</label>
                    <input type="number" name="duration" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Start Time</label>
                    <input type="time" name="startTime" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">End Time</label>
                    <input type="time" name="endTime" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Total Marks</label>
                  <input type="number" name="totalMarks" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="20" />
                </div>
                <button 
                  disabled={uploading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Create Quiz'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showAssignmentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Post New Assignment</h2>
                <button onClick={() => setShowAssignmentModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assignment Title</label>
                  <input name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Home Assignment 1" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea name="description" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="Assignment details and requirements..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Due Date</label>
                    <input type="datetime-local" name="dueDate" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">CO Mapping</label>
                    <select name="coMapping" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="Home Assignment">Home Assignment</option>
                      {course.coList.map(co => <option key={co} value={co}>{co}</option>)}
                      <option value="CO5">CO5</option>
                    </select>
                  </div>
                </div>
                <button 
                  disabled={uploading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Post Assignment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default CourseDetail;
