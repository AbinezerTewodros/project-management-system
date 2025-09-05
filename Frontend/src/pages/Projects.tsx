import { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import CreateProject from '@/components/CreateProject';
import { Plus, Users, Calendar, CheckCircle, Clock } from 'lucide-react';

const Projects = () => {
    const { getProjectsByRole } = useProject();
    const {} = useAuth();
    const [showCreateForm, setShowCreateForm] = useState(false);

    const projects = getProjectsByRole();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Projects</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Project
                </button>
            </div>

            {showCreateForm ? (
                <div className="mb-8">
                    <CreateProject
                        onSuccess={() => {
                            setShowCreateForm(false);
                        }}
                        onCancel={() => {
                            setShowCreateForm(false);
                        }}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">{project.title}</h2>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                                        project.status
                                    )}`}
                                >
                                    {project.status}
                                </span>
                            </div>

                            <p className="text-gray-600 mb-4">{project.description}</p>

                            <div className="space-y-3">
                                <div className="flex items-center text-gray-500">
                                    <Users className="w-5 h-5 mr-2" />
                                    <span>{project.teamMembers.length} Team Members</span>
                                </div>

                                <div className="flex items-center text-gray-500">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    <span>
                                        Created {new Date(project.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center text-gray-500">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    <span>
                                        {project.tasks.filter((t) => t.status === 'completed').length}/
                                        {project.tasks.length} Tasks Completed
                                    </span>
                                </div>

                                {project.tasks.length > 0 && (
                                    <div className="flex items-center text-gray-500">
                                        <Clock className="w-5 h-5 mr-2" />
                                        <span>
                                            {project.tasks.filter((t) => t.status === 'in-progress').length}{' '}
                                            Tasks In Progress
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <div className="flex flex-wrap gap-2">
                                    {project.teamMembers.slice(0, 3).map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                                        >
                                            <span className="text-sm text-gray-700">{member.name}</span>
                                        </div>
                                    ))}
                                    {project.teamMembers.length > 3 && (
                                        <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                                            <span className="text-sm text-gray-700">
                                                +{project.teamMembers.length - 3} more
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Projects;
