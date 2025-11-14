import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Briefcase, Layers, Star, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.name || user?.username || "");
  const [employeeId, setEmployeeId] = useState(user?.employeeId || "");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await authService.getProfile();
      if (mounted && res.success && res.data) {
        const p = res.data as any;
        setFullName(p.fullName || p.name || user?.name || user?.username || "");
        setEmployeeId(p.employeeId || user?.employeeId || "");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-white dark:bg-zinc-800 pt-2">
      {/* Back button outside modal, leftmost */}
      <div className="w-full flex items-center mt-6 mb-2 px-4">
        <button
          onClick={() => navigate('/dashboard/admin')}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200 transition-colors bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    
      {/* Banner/Header */}
    <div className="max-w-2xl mx-auto">
      <div className="w-full h-32 bg-gradient-to-r from-blue-900 to-purple-800 rounded-t-2xl flex items-end justify-center relative">
        <img
          src={
            user.image ||
            "https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg"
          }
          alt="Profile avatar"
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg absolute -bottom-14"
        />
      </div>
      {/* Card */}
      <div className="w-full bg-white dark:bg-gray-800/95 rounded-b-2xl shadow-xl pt-20 pb-8 px-6 mt-0 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
          <User size={22} /> {fullName}
        </h2>
        <div className="text-purple-700 dark:text-purple-300 font-medium mb-2">{user.username}</div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-6 mt-2 text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <Mail size={18} /> {user.email}
          </div>
          <div className="flex items-center gap-2">
            <Briefcase size={18} /> {user.role}
          </div>
          <div className="flex items-center gap-2">
            <Layers size={18} /> ID: {employeeId}
          </div>
        </div>
        <div className="w-full border-t pt-6 mt-2 border-gray-200 dark:border-gray-700">
          <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
            <Star size={18} className="text-yellow-500" /> Skills
          </div>
          <div className="flex flex-wrap gap-2">
            {user.skills && user.skills.length > 0 ? (
              user.skills.map((skill) => (
                <span
                  key={skill}
                  className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-1"
                >
                  <Star size={14} className="text-yellow-400" /> {skill}
                </span>
              ))
            ) : (
              <span className="text-gray-400 dark:text-gray-500">No skills added</span>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full">
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-semibold shadow-md w-full sm:w-auto"
            onClick={() => navigate("/profile/edit-profile")}
            aria-label="Edit Profile"
          >
            Edit Profile
          </button>
          <button
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold shadow-md w-full sm:w-auto"
            onClick={() => navigate("/profile/change-password")}
            aria-label="Change Password"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default UserProfile;
