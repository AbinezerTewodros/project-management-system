// Mock data for tasks and projects
export const projects = [
  { id: '1', name: 'Digital Banking Platform' },
  { id: '2', name: 'Cybersecurity Program' },
  { id: '3', name: 'Financial Literacy Portal' },
];

export const tasks = [
  {
    id: '1-1',
    projectId: '1',
    title: 'Core System Upgrade',
    description: 'Modernize legacy banking system with cloud architecture',
    dueDate: '2025-10-15',
    priority: 'High',
    status: 'in-progress',
    team: 'Platform Engineering',
    files: ['requirements.pdf'],
    assignedBy: 'Mr. Getenet',
    subtasks: [
      { id: '1-1-1', title: 'Design cloud architecture', completed: false, weight: 30 },
      { id: '1-1-2', title: 'Migrate legacy data', completed: false, weight: 70 }
    ]
  },
  {
    id: '2-1',
    projectId: '2',
    title: 'Implement MFA System',
    description: 'Deploy multi-factor authentication for all user accounts',
    dueDate: '2025-10-01',
    priority: 'High',
    status: 'to-do',
    team: 'Security Team',
    files: ['mfa_specs.docx', 'security_policy.pdf'],
    assignedBy: 'Mr. Getenet',
    subtasks: []
  },
  {
    id: '2-2',
    projectId: '2',
    title: 'Conduct Security Audit',
    description: 'Perform comprehensive security assessment of all systems',
    dueDate: '2025-11-30',
    priority: 'Medium',
    status: 'in-progress',
    team: 'Audit Team',
    files: ['audit_checklist.xlsx'],
    assignedBy: 'Mr. Getenet',
    subtasks: []
  },
  {
    id: '3-2',
    projectId: '3',
    title: 'Launch Awareness Campaign',
    description: 'Create and distribute financial literacy materials to schools',
    dueDate: '2025-11-01',
    priority: 'Medium',
    status: 'to-do',
    team: 'Marketing Team',
    files: ['campaign_plan.pptx'],
    assignedBy: 'Mr. Getenet',
    subtasks: []
  },
  {
    id: '3-3',
    projectId: '3',
    title: 'User Testing for Portal',
    description: 'Conduct user testing sessions for the financial literacy portal',
    dueDate: '2025-11-15',
    priority: 'Low',
    status: 'completed',
    team: 'UX Research',
    files: ['user_feedback.docx'],
    assignedBy: 'Mr. Getenet',
    subtasks: []
  },
  {
    id: '3-1',
    projectId: '3',
    title: 'Develop Educational Modules',
    description: 'Create interactive financial literacy learning materials',
    dueDate: '2025-12-15',
    priority: 'High',
    status: 'in-progress',
    team: 'Content Team',
    files: ['content_outline.pdf', 'design_specs.fig'],
    assignedBy: 'Mr. Getenet',
    subtasks: []
  }
];