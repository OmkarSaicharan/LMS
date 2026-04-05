import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Assignment, AssignmentSubmission } from '../types';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Upload,
  User,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const AssignmentPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { profile, isAdmin, isFaculty, isStudent } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [mySubmission, setMySubmission] = useState<AssignmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;

    const fetchAssignment = async () => {
      const docRef = doc(db, 'assignments', assignmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignment({ id: docSnap.id, ...docSnap.data() } as Assignment);
      }
      setLoading(false);
    };

    fetchAssignment();

    if (isStudent && profile) {
      const unsubscribeMySub = onSnapshot(
        query(
          collection(db, `assignments/${assignmentId}/submissions`),
          where('studentId', '==', profile.uid)
        ),
        (snapshot) => {
          if (!snapshot.empty) {
            setMySubmission({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AssignmentSubmission);
          }
        }
      );
      return () => unsubscribeMySub();
    } else if (isAdmin || isFaculty) {
      const unsubscribeAllSubs = onSnapshot(
        collection(db, `assignments/${assignmentId}/submissions`),
        (snapshot) => setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentSubmission)))
      );
      return () => unsubscribeAllSubs();
    }
  }, [assignmentId, profile, isStudent, isAdmin, isFaculty]);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assignmentId || !profile) return;
    
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    try {
      const storageRef = ref(storage, `assignments/${assignmentId}/${profile.uid}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const pdfUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, `assignments/${assignmentId}/submissions`), {
        assignmentId,
        studentId: profile.uid,
        pdfUrl,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      });

      alert('Assignment submitted successfully!');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewStatus = async (submissionId: string, status: 'reviewed') => {
    try {
      await updateDoc(doc(db, `assignments/${assignmentId}/submissions`, submissionId), { status });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>;
  if (!assignment) return <div className="text-center p-12">Assignment not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {assignment.coMapping}
              </span>
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <Clock size={12} />
                Due: {format(new Date(assignment.dueDate), 'MMM dd, hh:mm a')}
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900">{assignment.title}</h1>
            <p className="text-slate-600 max-w-2xl leading-relaxed">{assignment.description}</p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {isStudent ? (
            <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Upload size={20} className="text-indigo-600" />
                Your Submission
              </h2>
              
              {mySubmission ? (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-900">Submitted Successfully</p>
                        <p className="text-xs text-emerald-600 font-medium">
                          On {format(new Date(mySubmission.submittedAt), 'MMM dd, yyyy • hh:mm a')}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider",
                      mySubmission.status === 'reviewed' ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                    )}>
                      {mySubmission.status}
                    </span>
                  </div>
                  <a 
                    href={mySubmission.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-emerald-700 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all"
                  >
                    <Download size={18} />
                    View Submitted PDF
                  </a>
                </div>
              ) : (
                <form onSubmit={handleFileUpload} className="space-y-6">
                  <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center space-y-4 hover:border-indigo-300 transition-all group">
                    <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      <FileText size={32} />
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">Click to upload or drag and drop</p>
                      <p className="text-slate-500 text-xs">PDF files only (Max 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      name="file" 
                      accept=".pdf" 
                      required 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        // Simple visual feedback for file selection
                        const file = e.target.files?.[0];
                        if (file) alert(`Selected: ${file.name}`);
                      }}
                    />
                  </div>
                  <button 
                    disabled={uploading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Assignment'}
                  </button>
                </form>
              )}
            </section>
          ) : (
            <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Submissions ({submissions.length})</h2>
                <button className="text-sm font-bold text-indigo-600 hover:underline">Export All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted At</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">
                              <User size={14} />
                            </div>
                            <span className="text-sm font-bold text-slate-900">{sub.studentId.substring(0, 8)}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 font-medium">
                            {format(new Date(sub.submittedAt), 'MMM dd, hh:mm a')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 text-[10px] font-black rounded-full uppercase tracking-wider",
                            sub.status === 'reviewed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={sub.pdfUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </a>
                            {sub.status === 'submitted' && (
                              <button 
                                onClick={() => handleReviewStatus(sub.id, 'reviewed')}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Mark as Reviewed"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {submissions.length === 0 && (
                  <div className="p-12 text-center text-slate-500 font-medium">
                    No submissions yet.
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Assignment Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Posted On</p>
                  <p className="font-bold text-slate-700">{format(new Date(assignment.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Outcome Mapping</p>
                  <p className="font-bold text-slate-700">{assignment.coMapping}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-100">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-indigo-100 text-xs leading-relaxed mb-4">
              If you encounter any issues with your submission, please contact your course faculty or the IT support team.
            </p>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">
              Contact Support
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
