import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Course, Quiz, Notification } from '../types';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Bell, 
  Plus,
  Users,
  GraduationCap,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

const Dashboard: React.FC = () => {
  const { profile, isAdmin, isFaculty, isStudent } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcomingQuizzes, setUpcomingQuizzes] = useState<Quiz[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    let coursesQuery;
    if (isAdmin) {
      coursesQuery = query(collection(db, 'courses'), limit(10));
    } else if (isFaculty) {
      coursesQuery = query(collection(db, 'courses'), where('facultyIds', 'array-contains', profile.uid));
    } else {
      // For students, we'd normally have an enrollments collection
      // For this demo, let's show all active courses
      coursesQuery = query(collection(db, 'courses'), where('isActive', '==', true));
    }

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'courses');
    });

    const quizzesQuery = query(
      collection(db, 'quizzes'),
      where('isPublished', '==', true),
      orderBy('date', 'asc'),
      limit(5)
    );

    const unsubscribeQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
      setUpcomingQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'quizzes');
    });

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => {
      unsubscribeCourses();
      unsubscribeQuizzes();
      unsubscribeNotifications();
    };
  }, [profile, isAdmin, isFaculty, isStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.displayName}!</h1>
          <p className="text-slate-500 font-medium">Here's what's happening in your courses today.</p>
        </div>
        {isAdmin && (
          <Link 
            to="/admin/courses/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <Plus size={20} />
            New Course
          </Link>
        )}
      </header>

      {/* Stats Grid - Role Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAdmin ? (
          <>
            <StatCard icon={Users} label="Total Students" value="1,240" color="bg-blue-500" />
            <StatCard icon={GraduationCap} label="Total Faculty" value="86" color="bg-indigo-500" />
            <StatCard icon={BookOpen} label="Active Courses" value={courses.length.toString()} color="bg-emerald-500" />
            <StatCard icon={FileText} label="Total Submissions" value="452" color="bg-amber-500" />
          </>
        ) : isFaculty ? (
          <>
            <StatCard icon={BookOpen} label="My Courses" value={courses.length.toString()} color="bg-indigo-500" />
            <StatCard icon={Calendar} label="Pending Quizzes" value={upcomingQuizzes.length.toString()} color="bg-blue-500" />
            <StatCard icon={FileText} label="Assignments to Review" value="12" color="bg-amber-500" />
            <StatCard icon={Users} label="My Students" value="180" color="bg-emerald-500" />
          </>
        ) : (
          <>
            <StatCard icon={BookOpen} label="Enrolled Courses" value={courses.length.toString()} color="bg-indigo-500" />
            <StatCard icon={Calendar} label="Upcoming Quizzes" value={upcomingQuizzes.length.toString()} color="bg-blue-500" />
            <StatCard icon={FileText} label="Pending Assignments" value="3" color="bg-amber-500" />
            <StatCard icon={GraduationCap} label="GPA" value="3.8" color="bg-emerald-500" />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Courses Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">My Courses</h2>
            <Link to="/dashboard" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {courses.length > 0 ? courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                    {course.code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6">{course.description}</p>
                <Link 
                  to={`/courses/${course.id}`}
                  className="flex items-center justify-between w-full py-3 px-4 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl font-bold text-sm transition-all"
                >
                  Go to Course
                  <ChevronRight size={18} />
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-2 p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-medium">No courses found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          {/* Upcoming Quizzes */}
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Upcoming Quizzes
            </h2>
            <div className="space-y-4">
              {upcomingQuizzes.length > 0 ? upcomingQuizzes.map((quiz) => (
                <div key={quiz.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-2">{quiz.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {format(new Date(quiz.date), 'MMM dd, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {quiz.startTime}
                    </span>
                  </div>
                  <Link 
                    to={`/quizzes/${quiz.id}`}
                    className="mt-4 block text-center py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all"
                  >
                    View Details
                  </Link>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No upcoming quizzes.</p>
              )}
            </div>
          </section>

          {/* Recent Notifications */}
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Bell size={20} className="text-indigo-600" />
              Recent Alerts
            </h2>
            <div className="space-y-4">
              {notifications.length > 0 ? notifications.map((notif) => (
                <div key={notif.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    notif.type === 'quiz' ? "bg-blue-50 text-blue-600" :
                    notif.type === 'note' ? "bg-emerald-50 text-emerald-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight mb-1">{notif.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      {format(new Date(notif.createdAt), 'hh:mm a')}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-500 text-center py-4">No new notifications.</p>
              )}
            </div>
            <Link to="/notifications" className="mt-6 block text-center text-sm font-bold text-indigo-600 hover:underline">
              View All Notifications
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default Dashboard;
