import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Key, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  Mail,
  Lock,
  Loader2
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserRole } from '../types';
import { motion, useScroll, useTransform } from 'motion/react';
import { cn } from '../lib/utils';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Automatically assign admin role if email matches
        const finalRole = email === 'A@gmail.com' ? 'admin' : role;
        
        await updateProfile(user, { displayName: name });
        
        const profile = {
          uid: user.uid,
          email: user.email,
          role: finalRole,
          displayName: name,
          institutionalId: institutionalId,
          createdAt: new Date().toISOString(),
          isActive: true
        };
        
        await setDoc(doc(db, 'users', user.uid), profile);

        // Sync with Spring Boot Backend (MySQL)
        try {
          await fetch('http://localhost:8080/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
          });
        } catch (syncErr) {
          console.warn('Failed to sync with local backend:', syncErr);
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (!docSnap.exists()) {
          throw new Error('User profile not found');
        }
        
        const profile = docSnap.data();
        if (profile.role !== role && !showAdminLogin) {
          throw new Error(`Invalid role for this login. Please use the ${profile.role} portal.`);
        }
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden relative">
      {/* Global Background Image */}
      <div className="fixed inset-0 -z-10">
        <img 
          src="https://www.kluniversity.in/blog/images/best-engineering-university.jpg" 
          alt="Background" 
          className="w-full h-full object-cover opacity-100"
          referrerPolicy="no-referrer"
        />
      </div>
      {/* University Header Banner */}
      <div className="w-full bg-[#9e1c21] overflow-hidden sticky top-0 z-[60]">
        <img 
          src="https://www.kluniversity.in/img/KLU-Hedder-main.jpg" 
          alt="KLU Header" 
          className="w-full h-auto max-h-24 object-contain mx-auto"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Navigation */}
      <nav className="sticky top-[96px] w-full z-50 bg-white/40 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
            <img 
              src="https://www.kluniversity.in/img/KLU-Hedder-main.jpg" 
              alt="KLU Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">College LMS</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowAdminLogin(!showAdminLogin)}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
            title="Admin Access"
          >
            <Key size={20} />
          </button>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden min-h-[80vh] flex items-center">
        {/* Removed decorative blurs for clarity */}

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <img 
                src="https://lms.kluniversity.in/pluginfile.php/1/theme_lambda/logo/1767415413/kl.png" 
                alt="KLU LMS Logo" 
                className="h-32 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
              Empowering the <span className="text-[#9e1c21]">Next Generation</span> of Learners
            </h1>
            <div className="bg-[#9e1c21] p-6 mb-8 max-w-lg shadow-xl">
              <p className="text-xl text-white leading-relaxed">
                A comprehensive learning management system designed for modern colleges. 
                Streamline courses, quizzes, and assignments in one secure platform.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white/70 rounded-3xl shadow-2xl shadow-indigo-100 border border-slate-100 p-8 md:p-10"
          >
            <div className="flex gap-2 p-1 bg-white/20 rounded-2xl mb-8">
              {!showAdminLogin && (
                <>
                  <button 
                    onClick={() => { setRole('student'); setAuthMode('login'); }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      role === 'student' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Student
                  </button>
                  <button 
                    onClick={() => { setRole('faculty'); setAuthMode('login'); }}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      role === 'faculty' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Faculty
                  </button>
                </>
              )}
              {showAdminLogin && (
                <div className="flex-1 py-3 text-center text-indigo-600 font-bold flex items-center justify-center gap-2">
                  <ShieldCheck size={18} />
                  Admin Portal
                </div>
              )}
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {showAdminLogin ? 'Admin Sign In' : authMode === 'login' ? `Sign In as ${role}` : `Create ${role} Account`}
              </h2>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                  {error}
                </div>
              )}

              {authMode === 'signup' && !showAdminLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-4 bg-white/20 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{role === 'student' ? 'Student ID' : 'Faculty ID'}</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        required
                        value={institutionalId}
                        onChange={(e) => setInstitutionalId(e.target.value)}
                        placeholder={role === 'student' ? "2200030000" : "F1234"}
                        className="w-full pl-12 pr-4 py-4 bg-white/20 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@college.edu"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {!showAdminLogin && (
                <p className="text-center text-slate-500 text-sm">
                  {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                  <button 
                    type="button"
                    onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              )}
              
              {showAdminLogin && (
                <button 
                  type="button"
                  onClick={() => { setShowAdminLogin(false); setRole('student'); }}
                  className="w-full text-slate-500 text-sm font-medium hover:text-slate-700"
                >
                  Back to Student/Faculty Login
                </button>
              )}
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-transparent px-6">
        <div className="max-w-7xl mx-auto bg-[#9e1c21]/90 rounded-[3rem] p-12 md:p-20 shadow-2xl shadow-red-900/20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything you need to succeed</h2>
            <p className="text-red-50 max-w-2xl mx-auto font-medium">
              Our LMS provides a comprehensive set of tools for students and faculty to manage their academic journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Course Management', desc: 'Admin can easily manage courses and assign faculty to them.', icon: BookOpen },
              { 
                title: 'Interactive Quizzes', 
                desc: 'Faculty can create and schedule quizzes with instant results.', 
                img: "https://www.kluniversity.in/img/KLU-Hedder-main.jpg" 
              },
              { title: 'Assignment Tracking', desc: 'Submit and review assignments with CO-based mapping.', icon: CheckCircle2 }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white/0 p-8 rounded-3xl border border-white/10 shadow-lg"
              >
                <div className="w-14 h-14 bg-white text-[#9e1c21] rounded-2xl flex items-center justify-center mb-6 overflow-hidden shadow-lg">
                  {feature.icon ? (
                    <feature.icon size={28} />
                  ) : (
                    <img 
                      src={feature.img} 
                      alt={feature.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-red-50 leading-relaxed opacity-90">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
