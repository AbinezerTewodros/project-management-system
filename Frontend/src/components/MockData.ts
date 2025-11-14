import { Employee, Project } from '@/types/types';

export const currentUser = { id: "user1", name: "Me" };

// Mock employee data
export const mockEmployees: Employee[] = [
  { id: "user1", name: "Myself", department: "Engineering", position: "Senior Developer", role: "team_member" },
  { id: "emp123", name: "Kalkidan", department: "Engineering", position: "Frontend Developer", role: "team_member" },
  { id: "emp124", name: "Mahlet", department: "Design", position: "UI/UX Designer", role: "team_member" },
  { id: "emp125", name: "Dehine", department: "Engineering", position: "Tech Lead", role: "team_member" },
  { id: "emp126", name: "Abenezer", department: "Engineering", position: "Backend Developer", role: "team_member" },
];

export const mockProjects: Project[] = [
  {
    id: 1,
    title: "Project Alpha",
    description: "Modernize legacy banking system with cloud architecture",
    dueDate: "2025-10-15",
    createdBy: "user1",
    teamMembers: [mockEmployees[0], mockEmployees[1], mockEmployees[4]],
    scrumMaster: mockEmployees[3],
    teamLeader: mockEmployees[2],
    priority: "High",
    status: "In Progress",
    progress: 60,
    files: [
      {
        name: "requirements.pdf",
        size: 1024 * 200,
        type: "application/pdf",
        url: "#"
      }
    ],
    milestones: [
      {
        id: "milestone1",
        title: "Design Phase Complete",
        description: "Complete all design related tasks",
        assignee: "Kalkidan",
        assigneeId: "emp123",
        status: "To Do",
        priority: "High",
        dueDate: "2025-07-15",
        weight: 100,
        tasks: [
          {
            id: "m-task1",
            title: "Finalize UI Design",
            description: "Get approval on final UI design",
            assignee: "Mahlet",
            assigneeId: "emp124",
            status: "In Progress",
            priority: "High",
            dueDate: "2025-06-30"
          }
        ]
      },
      {
        id: "milestone2",
        title: "Development Complete",
        description: "Complete all development tasks",
        assignee: "Dehine",
        assigneeId: "emp125",
        status: "To Do",
        priority: "Medium",
        dueDate: "2025-09-15",
        weight: 100
      }
    ],
    tasks: [
      {
        id: "task1",
        title: "Design database schema",
        description: "Create the new database schema for the cloud system",
        assignee: "Kalkidan",
        assigneeId: "emp123",
        status: "In Progress",
        priority: "High",
        dueDate: "2025-06-15",
        subtask: [
          { id: '1', title: 'Design cloud architecture', weight: 30, completed: false, assignee: "" },
          { id: '2', title: 'Migrate legacy data', weight: 70, completed: false, assignee: "" }
        ],
      },
      {
        id: "task2",
        title: "Implement authentication",
        description: "Create secure authentication system",
        assignee: "Abenezer",
        assigneeId: "emp126",
        status: "To Do",
        priority: "High",
        dueDate: "2025-07-01",
        subtask: [
          { id: '3', title: 'Set up OAuth', weight: 40, completed: false },
          { id: '4', title: 'Create login UI', weight: 60, completed: false }
        ],
      }
    ]
  },
  {
    id: 2,
    title: "Project Beta",
    description: "E-commerce platform redesign",
    dueDate: "2025-08-20",
    createdBy: "user1",
    teamMembers: [mockEmployees[0], mockEmployees[2], mockEmployees[3]],
    scrumMaster: mockEmployees[1],
    teamLeader: mockEmployees[4],
    priority: "Medium",
    status: "To Do",
    progress: 10,
    files: [],
    milestones: [],
    tasks: []
  }
];

// Helper functions
export const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const PRIORITY_COLORS = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-yellow-100 text-yellow-800',
  'Low': 'bg-green-100 text-green-800',
};

export const STATUS_COLORS = {
  'To Do': 'bg-red-100 text-red-800 border-red-300',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Done': 'bg-green-100 text-green-800 border-green-300',
};
