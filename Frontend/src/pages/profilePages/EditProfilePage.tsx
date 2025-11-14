import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  Mail,
  Phone,
  User,
  UserCircle,
  Key,
  UserCog,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services";
import { toast } from "react-hot-toast";

const EditProfilePage = ({darkMode}: {darkMode:boolean}) => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState({
    image:
      "https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg",
    name: user?.name || "",
    username: user?.username || "",
    employeeId: user?.employeeId || "",
    primaryEmail: user?.email || "",
    primaryPhone: user?.phone || "",
    additionalEmails: [] as string[],
    additionalPhones: [] as string[],
  });
  // const [newEmail, setNewEmail] = useState('');
  // const [newPhone, setNewPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  // Skills temporarily disabled per requirements

  // Load profile from API to ensure full name and employeeId are accurate
  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await authService.getProfile();
      if (mounted && res.success && res.data) {
        const p = res.data as any;
        setProfileData((prev) => ({
          ...prev,
          name: p.fullName || p.name || prev.name,
          username: p.userName || p.username || prev.username,
          employeeId: p.employeeId || prev.employeeId,
          primaryEmail: p.email || prev.primaryEmail,
          primaryPhone: p.phoneNumber || prev.primaryPhone,
        }));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setProfileData({ ...profileData, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Additional contacts management disabled per requirements

  // Removed per requirements

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log('Updating profile with data:', {
        email: profileData.primaryEmail,
        phone: profileData.primaryPhone,
        image: profileData.image ? 'Base64 image data present' : 'No image data'
      });
      
      await updateProfile({
        email: profileData.primaryEmail,
        phone: profileData.primaryPhone,
        image: profileData.image, // ✅ FIX: Include profile picture
      });
      toast.success("Profile updated successfully");
      navigate("/profile");
    } catch (err) {
      console.error('Profile update error:', err);
      setError("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

   return (
    <div className="max-h-screen w-full bg-white dark:bg-zinc-800 ">
      {/* Back button outside modal, leftmost */}
      <div className="w-full flex items-center mt-6 mb-2 px-4">
              <button
                onClick={() => {
                  // Navigate to dashboard based on normalized role from AuthContext
                  const role = user?.role || "";
                  // Common roles in the app use paths like /dashboard/<role>
                  // Admin should go to /dashboard/admin, members to /dashboard/member, etc.
                  const target = role ? `/dashboard/${role}` : "/dashboard";
                  navigate(target);
                }}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-400 dark:hover:text-gray-200 transition-colors bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-700/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft size={18} /> Back
              </button>
            </div>

      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800/95 p-6 rounded-xl shadow-md overflow-hidden">
        {/* profile header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-800 p-6 flex flex-col md:flex-row items-center">
          <div className="relative group mb-4 md:mb-0 md:mr-6">
            <img
              src={profileData.image}
              alt="Profile avatar"
              aria-label="Profile image"
              title="Profile image"
              className="w-22 h-22 md:w-32 md:h-32 rounded-full object-cover border-white shadow-lg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-gray-600 text-white p-2 rounded-full transition-opacity duration-300"
              aria-label="Change profile image"
              title="Change profile image"
            >
              <Camera size={18} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              title="Upload profile image"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Edit Your Profile
            </h1>
            <p className="text-blue-100">Update your personal information</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="text-red-500 text-sm p-2 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <span className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-gray-500 dark:text-gray-300">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  required
                  disabled
                  aria-label="Full Name"
                  placeholder="Full Name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Username
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <span className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-gray-500 dark:text-gray-300">
                  <UserCircle size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) =>
                    setProfileData({ ...profileData, username: e.target.value })
                  }
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  required
                  disabled
                  aria-label="Username"
                  placeholder="Username"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Employee ID
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <span className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-gray-500 dark:text-gray-300">
                  <Key size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.employeeId}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      employeeId: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  required
                  disabled
                  aria-label="Employee ID"
                  placeholder="Employee ID"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Current Role
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <span className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-gray-500 dark:text-gray-300">
                  <UserCog size={18} />
                </span>
                <input
                  type="text"
                  value={user?.role || ""}
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-300"
                  disabled
                  aria-label="Current Role"
                  placeholder="Current Role"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Role changes can only be made by an administrator
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 items-center">
                <Mail size={16} className="mr-2" /> Primary Email
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <input
                  type="email"
                  value={profileData.primaryEmail}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      primaryEmail: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  required
                  aria-label="Primary Email"
                  placeholder="Primary Email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 items-center">
                <Phone size={16} className="mr-2" /> Primary Phone
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden dark:border-gray-700">
                <input
                  type="tel"
                  value={profileData.primaryPhone}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      primaryPhone: e.target.value,
                    })
                  }
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                  required
                  aria-label="Primary Phone"
                  placeholder="Primary Phone"
                />
              </div>
            </div>
          </div>

          {/* Additional emails/phones removed per requirements; only primary email/phone editable */}

          {/* Skills entry removed for now; will be added later */}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-colors ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
