import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import { 
  Bell, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  FileText,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 font-medium">Stay updated with your academic activities.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            Mark all as read
          </button>
        )}
      </header>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length > 0 ? notifications.map((notif) => (
            <motion.div
              layout
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-6 group transition-all",
                !notif.isRead && "border-l-4 border-l-indigo-600"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                notif.type === 'quiz' ? "bg-blue-50 text-blue-600" :
                notif.type === 'note' ? "bg-emerald-50 text-emerald-600" :
                notif.type === 'assignment' ? "bg-amber-50 text-amber-600" :
                "bg-indigo-50 text-indigo-600"
              )}>
                {notif.type === 'quiz' ? <GraduationCap size={28} /> :
                 notif.type === 'note' ? <FileText size={28} /> :
                 notif.type === 'assignment' ? <BookOpen size={28} /> :
                 <Bell size={28} />}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={cn(
                    "text-lg font-bold text-slate-900",
                    !notif.isRead && "text-indigo-900"
                  )}>
                    {notif.title}
                  </h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed">{notif.message}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {format(new Date(notif.createdAt), 'MMM dd, hh:mm a')}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px]">
                    {notif.type}
                  </span>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="p-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
              <Bell className="mx-auto text-slate-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No notifications yet</h3>
              <p className="text-slate-500 font-medium">We'll let you know when something important happens.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default NotificationsPage;
