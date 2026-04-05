import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Calendar, 
  Edit2, 
  Camera, 
  Loader2,
  CheckCircle2,
  LogOut,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const ProfilePage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and settings.</p>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          <Edit2 size={18} />
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </header>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl">
                {profile.displayName.charAt(0)}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all">
                <Camera size={16} />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{profile.displayName}</h2>
              <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">{profile.role}</p>
            </div>
            <div className="pt-6 border-t border-slate-50">
              <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-bold">
                <CheckCircle2 size={16} />
                Account Verified
              </div>
            </div>
          </div>

          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Details Card */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Personal Information
            </h3>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <User size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{profile.displayName}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700">{profile.email}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <ShieldCheck size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700 uppercase">{profile.role}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined On</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Calendar size={18} className="text-slate-400" />
                  <span className="font-bold text-slate-700">
                    {format(new Date(profile.createdAt), 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Lock size={20} className="text-indigo-600" />
              Security Settings
            </h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Password</p>
                <p className="text-sm text-slate-500">Change your account password regularly.</p>
              </div>
              <button className="px-6 py-3 bg-white border border-slate-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all">
                Update Password
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
