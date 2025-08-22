import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Mail, Minus, Phone, Plus, User, UserCircle, Key, UserCog } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";



const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState({
    image: 'https://t4.ftcdn.net/jpg/05/89/93/27/360_F_589932782_vQAEAZhHnq1QCGu5ikwrYaQD0Mmurm0N.jpg',
    name: user?.name || '',
    username: user?.username || '',
    employeeId: user?.employeeId || '',
    primaryEmail: user?.email || '',
    primaryPhone: user?.phone || '',
    additionalEmails: [] as string[],
    additionalPhones: [] as string[],
  });
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkill, setNewSkill] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setProfileData({ ...profileData, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addContact = (type: 'email' | 'phone') => {
    const value = type === 'email' ? newEmail : newPhone;
    if (!value) return;
    const field = type === 'email' ? 'additionalEmails' : 'additionalPhones';

    if (!profileData[field].includes(value)) {
      setProfileData({
        ...profileData, [field]: [...profileData[field], value]
      });
      type === 'email' ? setNewEmail('') : setNewPhone('');
    }
  };

  const removeContact = (type: 'email' | 'phone', index: number) => {
    const field = type === 'email' ? 'additionalEmails' : 'additionalPhones';
    setProfileData({
      ...profileData,
      [field]: profileData[field].filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await updateProfile({
        name: profileData.name,
        username: profileData.username,
        employeeId: profileData.employeeId,
        email: profileData.primaryEmail,
        phone: profileData.primaryPhone,
        skills,
        image: profileData.image,
      });
      navigate('/profile');
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto mt-5 p-6 min-h-screen bg-gray-50 shadow-md rounded-lg">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-purple-600 mb-6 hover:text-purple-400 transition-colors">
        <ArrowLeft size={20} /> Back
      </button>

      <div className="max-w mx-auto bg-white p-6 rounded-xl shadow-md overflow-hidden">
        {/* profile header */}
        <div className='bg-gradient-to-r from-purple-50 to-blue-50 p-6 flex flex-col md:flex-row items-center'>
          <div className='relative group mb-4 md:mb-0 md:mr-6'>
            <img
              src={profileData.image}
              alt='Profile'
              className='w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-white shadow-lg' />
            <button
              onClick={() => fileInputRef.current?.click()}
              className='absolute bottom-0 right-0 bg-gray-600 text-white p-2 rounded-full transition-opacity duration-300'>
              <Camera size={18} />
            </button>
            <input type='file' ref={fileInputRef} onChange={handleImageUpload} accept='image/*' className='hidden' />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Your Profile</h1>
            <p className="text-gray-600">Update your personal information</p>
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
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-4 py-2 text-gray-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="flex-1 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-4 py-2 text-gray-500">
                  <UserCircle size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="flex-1 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-4 py-2 text-gray-500">
                  <Key size={18} />
                </span>
                <input
                  type="text"
                  value={profileData.employeeId}
                  onChange={(e) => setProfileData({ ...profileData, employeeId: e.target.value })}
                  className="flex-1 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Current Role</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="bg-gray-100 px-4 py-2 text-gray-500">
                  <UserCog size={18} />
                </span>
                <input
                  type="text"
                  value={user?.role || ''}
                  className="flex-1 px-4 py-2 bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Role changes can only be made by an administrator</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 items-center">
                <Mail size={16} className="mr-2" /> Primary Email
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <input
                  type="email"
                  value={profileData.primaryEmail}
                  onChange={(e) => setProfileData({ ...profileData, primaryEmail: e.target.value })}
                  className="flex-1 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 items-center">
                <Phone size={16} className="mr-2" /> Primary Phone
              </label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <input
                  type="tel"
                  value={profileData.primaryPhone}
                  onChange={(e) => setProfileData({ ...profileData, primaryPhone: e.target.value })}
                  className="flex-1 px-4 py-2 focus:outline-none focus:ring-1 focus:ring-purple-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 items-center">
                Additional Emails
              </label>
              <div className="flex mb-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
                <button
                  type="button"
                  onClick={() => addContact('email')}
                  className="bg-purple-600 text-white px-3 rounded-r-lg hover:bg-purple-700 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
              <ul className="space-y-2">
                {profileData.additionalEmails.map((email, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg" >
                    <span className="text-sm">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeContact('email', index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full">
                      <Minus size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 items-center">
                Additional Phones
              </label>
              <div className="flex mb-2">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
                <button
                  type="button"
                  onClick={() => addContact('phone')}
                  className="bg-purple-600 text-white px-3 rounded-r-lg hover:bg-purple-700 transition-colors">
                  <Plus size={20} />
                </button>
              </div>
              <ul className="space-y-2">
                {profileData.additionalPhones.map((phone, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg" >
                    <span className="text-sm">{phone}</span>
                    <button
                      type="button"
                      onClick={() => removeContact('phone', index)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full">
                      <Minus size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill, idx) => (
                <span key={skill + idx} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {skill}
                  <button
                    type="button"
                    className="ml-1 text-purple-700 hover:text-red-500 focus:outline-none"
                    onClick={() => setSkills(skills.filter((s, i) => i !== idx))}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                      setSkills([...skills, newSkill.trim()]);
                      setNewSkill("");
                    }
                  }
                }}
                placeholder="Add a skill"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-300"
              />
              <button
                type="button"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors"
                onClick={() => {
                  if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                    setSkills([...skills, newSkill.trim()]);
                    setNewSkill("");
                  }
                }}
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Press Enter or click Add to add a skill. Click × to remove.</p>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfilePage;
