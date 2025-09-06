import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Briefcase, Layers, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 min-h-screen flex flex-col items-center px-2">
      {/* Banner/Header */}
      <div className="w-full h-32 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-t-2xl flex items-end justify-center relative">
        <img
          src={user.image || 'https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg'}
          alt="Profile avatar"
          className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg absolute -bottom-14"
        />
      </div>
      {/* Card */}
      <div className="w-full bg-white rounded-b-2xl shadow-xl pt-20 pb-8 px-6 mt-0 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2"><User size={22} /> {user.name}</h2>
        <div className="text-purple-700 font-medium mb-2">{user.role}</div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-6 mt-2 text-gray-600">
          <div className="flex items-center gap-2"><Mail size={18} /> {user.email}</div>
          <div className="flex items-center gap-2"><Briefcase size={18} /> {user.department || user.role}</div>
          <div className="flex items-center gap-2"><Layers size={18} /> ID: {user.employeeId}</div>
        </div>
        <div className="w-full border-t pt-6 mt-2">
          <div className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><Star size={18} className="text-yellow-500" /> Skills</div>
          <div className="flex flex-wrap gap-2">
            {(user.skills && user.skills.length > 0) ? user.skills.map((skill) => (
              <span key={skill} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center gap-1">
                <Star size={14} className="text-yellow-400" /> {skill}
              </span>
            )) : <span className="text-gray-400">No skills added</span>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 w-full">
          <button
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors font-semibold shadow-md w-full sm:w-auto"
            onClick={() => navigate("/profile/edit-profile")}
            aria-label="Edit Profile"
          >
            Edit Profile
          </button>
          <button
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold shadow-md w-full sm:w-auto"
            onClick={() => navigate("/profile/change-password")}
            aria-label="Change Password"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
