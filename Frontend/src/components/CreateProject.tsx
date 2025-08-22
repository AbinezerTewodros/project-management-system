import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { Role, roleHierarchy } from '@/types/roles';
import { TeamMember } from '@/types/project';
import { useNavigate } from 'react-router-dom';
import { ArrowBigLeft } from 'lucide-react';

interface CreateProjectProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ onSuccess, onCancel }) => {
    const { createProject, getAvailableTeamMembers } = useProject();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | ''>('');
    const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (selectedRole) {
            loadAvailableMembers(selectedRole);
        }
    }, [selectedRole]);

    const loadAvailableMembers = async (role: Role) => {
        const members = await getAvailableTeamMembers(role);
        setAvailableMembers(members);
    };

    const handleRoleChange = (role: Role) => {
        setSelectedRole(role);
        setSelectedMembers([]);
    };

    const handleMemberSelect = (member: TeamMember) => {
        if (!selectedMembers.find(m => m.id === member.id)) {
            setSelectedMembers([...selectedMembers, member]);
        }
    };

    const handleMemberRemove = (memberId: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== memberId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createProject({
                title,
                description,
                createdBy: user.id,
                status: 'active',
                teamMembers: selectedMembers,
                tasks: [],
            });
            onSuccess?.();
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setLoading(false);
        }
    };

    const availableRoles = user ? roleHierarchy[user.role as Role].canAdd : [];

    return (
        <div className="max-w-2xl mx-auto p-6">
            <button  type='button' 
                 onClick={() => navigate(-1)}
                 className='mb-4 flex items-center text-gray-600 hover:underline'>
                    <ArrowBigLeft className="mr-2" />
                Back
            </button>
            <h2 className="text-2xl font-bold mb-6">Create New </h2>

            <form onSubmit={handleSubmit} className="space-y-6 ">
                <div>
                    <label className="block text-sm font-medium mb-2">Project Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows={4}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Add Team Members</label>
                    <select
                        value={selectedRole}
                        onChange={(e) => handleRoleChange(e.target.value as Role)}
                        className="w-full p-2 border rounded-md mb-4"
                    >
                        <option value="">Select a role</option>
                        {availableRoles.map((role) => (
                            <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                        ))}
                    </select>

                    {selectedRole && (
                        <div className="space-y-4">
                            <div className="border rounded-md p-4">
                                <h3 className="font-medium mb-2">Available Members</h3>
                                <div className="space-y-2">
                                    {availableMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                                        >
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleMemberSelect(member)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedMembers.length > 0 && (
                                <div className="border rounded-md p-4">
                                    <h3 className="font-medium mb-2">Selected Members</h3>
                                    <div className="space-y-2">
                                        {selectedMembers.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                            >
                                                <div>
                                                    <p className="font-medium">{member.name}</p>
                                                    <p className="text-sm text-gray-500">{member.email}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMemberRemove(member.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Project'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateProject;
