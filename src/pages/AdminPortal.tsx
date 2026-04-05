import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Course } from '../types';
import { 
  Users, 
  BookOpen, 
  ShieldCheck, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  X,
  BarChart3,
  PieChart,
  Activity,
  UserPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'reports'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalCourses: 0,
    activeQuizzes: 0,
    totalSubmissions: 0
  });

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(allUsers);
      setStats(prev => ({
        ...prev,
        totalStudents: allUsers.filter(u => u.role === 'student').length,
        totalFaculty: allUsers.filter(u => u.role === 'faculty').length
      }));
    });

    const unsubscribeCourses = onSnapshot(collection(db, 'courses'), (snapshot) => {
      const allCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(allCourses);
      setStats(prev => ({ ...prev, totalCourses: allCourses.length }));
      setLoading(false);
    });

    const unsubscribeQuizzes = onSnapshot(collection(db, 'quizzes'), (snapshot) => {
      setStats(prev => ({ ...prev, activeQuizzes: snapshot.size }));
    });

    const unsubscribeSubmissions = onSnapshot(collection(db, 'submissions'), (snapshot) => {
      setStats(prev => ({ ...prev, totalSubmissions: snapshot.size }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeCourses();
      unsubscribeQuizzes();
      unsubscribeSubmissions();
    };
  }, []);

  const handleAssignFaculty = async (courseId: string, facultyId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const currentFacultyIds = course.facultyIds || [];
    const newFacultyIds = currentFacultyIds.includes(facultyId) 
      ? currentFacultyIds.filter(id => id !== facultyId)
      : [...currentFacultyIds, facultyId];

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        facultyIds: newFacultyIds
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isActive: !user.isActive
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const courseData = {
      title: formData.get('title') as string,
      code: formData.get('code') as string,
      description: formData.get('description') as string,
      semester: formData.get('semester') as string,
      department: formData.get('department') as string,
      isActive: true,
      coList: ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'],
      facultyIds: [],
      createdAt: new Date().toISOString()
    };

    try {
      if (editingCourse) {
        await updateDoc(doc(db, 'courses', editingCourse.id), courseData);
        
        // Sync with Spring Boot Backend (MySQL)
        try {
          await fetch(`http://localhost:8080/api/courses/${editingCourse.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
          });
        } catch (syncErr) {
          console.warn('Failed to sync course update with local backend:', syncErr);
        }
      } else {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        
        // Sync with Spring Boot Backend (MySQL)
        try {
          await fetch('http://localhost:8080/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
          });
        } catch (syncErr) {
          console.warn('Failed to sync course creation with local backend:', syncErr);
        }
      }
      setShowCourseModal(false);
      setEditingCourse(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        
        // Sync with Spring Boot Backend (MySQL)
        try {
          await fetch(`http://localhost:8080/api/courses/${id}`, {
            method: 'DELETE'
          });
        } catch (syncErr) {
          console.warn('Failed to sync course deletion with local backend:', syncErr);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Portal</h1>
          <p className="text-slate-500 font-medium">Manage users, courses, and system settings.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'courses', label: 'Courses', icon: BookOpen },
            { id: 'reports', label: 'Reports', icon: ShieldCheck }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        {activeTab === 'courses' && (
          <button 
            onClick={() => { setEditingCourse(null); setShowCourseModal(true); }}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Course
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                            {user.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.displayName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider",
                          user.role === 'admin' ? "bg-purple-50 text-purple-700" :
                          user.role === 'faculty' ? "bg-blue-50 text-blue-700" :
                          "bg-emerald-50 text-emerald-700"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                          <span className={cn(
                            "text-xs font-bold",
                            user.isActive ? "text-emerald-600" : "text-red-600"
                          )}>
                            {user.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleToggleUserStatus(user)}
                          className={cn(
                            "text-xs font-bold px-3 py-1 rounded-lg transition-all",
                            user.isActive ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                          )}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'courses' && (
            <motion.div
              key="courses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase())).map((course) => (
                <div key={course.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedCourse(course); setShowFacultyModal(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                        title="Assign Faculty"
                      >
                        <UserPlus size={18} />
                      </button>
                      <button 
                        onClick={() => { setEditingCourse(course); setShowCourseModal(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{course.title}</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-4">{course.code} • {course.semester}</p>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-6">{course.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {course.facultyIds.length} Faculty Assigned
                    </span>
                    <Link to={`/courses/${course.id}`} className="text-indigo-600 hover:underline">
                      <ChevronRight size={20} />
                    </Link>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 space-y-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total Faculty', value: stats.totalFaculty, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Active Courses', value: stats.totalCourses, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Active Quizzes', value: stats.activeQuizzes, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map((stat) => (
                  <div key={stat.label} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-sm", stat.bg, stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    Engagement Overview
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-600">Quiz Participation</span>
                        <span className="text-indigo-600">85%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-[85%]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-600">Assignment Completion</span>
                        <span className="text-emerald-600">72%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 w-[72%]" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-slate-600">Notes Download Rate</span>
                        <span className="text-purple-600">94%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 w-[94%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <PieChart size={20} className="text-indigo-600" />
                    System Health
                  </h3>
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="w-24 h-24 border-8 border-emerald-500 border-t-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-xl font-black text-slate-900">98%</span>
                      </div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Uptime & Stability</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button onClick={() => setShowCourseModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Course Code</label>
                  <input name="code" defaultValue={editingCourse?.code} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="CS101" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Semester</label>
                  <input name="semester" defaultValue={editingCourse?.semester} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Fall 2026" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Course Title</label>
                <input name="title" defaultValue={editingCourse?.title} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Introduction to Computer Science" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Department</label>
                <input name="department" defaultValue={editingCourse?.department} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Computer Science" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <textarea name="description" defaultValue={editingCourse?.description} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24" placeholder="Course overview..." />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
              >
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Faculty Assignment Modal */}
      <AnimatePresence>
        {showFacultyModal && selectedCourse && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Assign Faculty</h2>
                <button onClick={() => setShowFacultyModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {(() => {
                  const currentCourse = courses.find(c => c.id === selectedCourse.id) || selectedCourse;
                  const currentFacultyIds = currentCourse.facultyIds || [];
                  return (
                    <>
                      <p className="text-sm text-slate-500 font-medium mb-4">Select faculty members for <span className="font-bold text-slate-900">{currentCourse.title}</span></p>
                      {users.filter(u => u.role === 'faculty').map((faculty) => (
                        <div key={faculty.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                              {faculty.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{faculty.displayName}</p>
                              <p className="text-xs text-slate-500">{faculty.email}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleAssignFaculty(currentCourse.id, faculty.uid)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                              currentFacultyIds.includes(faculty.uid)
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                            )}
                          >
                            {currentFacultyIds.includes(faculty.uid) ? 'Remove' : 'Assign'}
                          </button>
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPortal;
