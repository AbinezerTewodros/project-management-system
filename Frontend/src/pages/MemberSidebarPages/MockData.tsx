export const projects = [
  { id: '1', name: 'Digital Banking Platform Modernization' },
  { id: '2', name: 'Cybersecurity Enhancement Program' },
  { id: '3', name: 'Financial Literacy Portal' },
];

export const tasksData = {
  '1': [
    {
      id: '1-1',
      title: 'Core Banking System Upgrade',
      creator: 'Mahlet', // Add creator field
      subtasks: [
        { 
          id: '1-1-1', 
          title: 'Migrate legacy mainframe to cloud-based solution', 
          status: 'completed', 
          priority: 'High',
          creator: 'Mahlet', // Add creator
          assignee: 'Tewodros' // Add assignee
        },
        { 
          id: '1-1-2', 
          title: 'Implement API integrations with government systems', 
          status: 'completed', 
          priority: 'Medium',
          creator: 'Mahlet',
          assignee: 'Mahlet',
          recentlyViewed: true
        },
        { 
          id: '1-1-3', 
          title: 'Develop disaster recovery protocols', 
          status: 'completed', 
          priority: 'Low',
          creator: 'Tewodros',
          assignee: 'Mahlet',
          recentlyViewed: true
        },
      ]
    },
    {
      id: '1-2',
      title: 'Online Loan Processing System',
      creator: 'Tewodros',
      subtasks: [
        { 
          id: '1-2-1', 
          title: 'Automate credit scoring with government data', 
          status: 'completed', 
          priority: 'High',
          creator: 'Mahlet',
          assignee: 'Tewodros'
        },
        { 
          id: '1-2-2', 
          title: 'Develop document verification workflow', 
          status: 'in-progress', 
          priority: 'High',
          creator: 'Mahlet',
          assignee: 'Mahlet'
        },
        { 
          id: '1-2-3', 
          title: 'Create audit trails for compliance', 
          status: 'to-do', 
          priority: 'Medium',
          creator: 'Tewodros',
          assignee: 'Mahlet'
        },
        { 
          id: '1-2-4', 
          title: 'Incident response drills', 
          status: 'to-do', 
          priority: 'Low',
          creator: 'Mahlet',
          assignee: 'Tewodros'
        },
      ]
    }
  ],
  '2': [
    {
      id: '2-1',
      title: 'Employee Security Training',
      creator: 'Mahlet',
      subtasks: [
        { 
          id: '2-1-1', 
          title: 'Phishing simulation platform', 
          status: 'completed', 
          priority: 'Medium',
          creator: 'Tewodros',
          assignee: 'Mahlet'
        },
        { 
          id: '2-1-2', 
          title: 'Privileged access management', 
          status: 'in-progress', 
          priority: 'High',
          creator: 'Mahlet',
          assignee: 'Mahlet'
        },
        { 
          id: '2-1-3', 
          title: 'Incident response drills', 
          status: 'to-do', 
          priority: 'High',
          creator: 'Mahlet',
          assignee: 'Tewodros'
        },
      ]
    }
  ],
  '3': [
    {
      id: '3-1',
      title: 'Data Protection Framework',
      creator: 'Tewodros',
      subtasks: [
        { 
          id: '3-1-1', 
          title: 'Encryption key management', 
          status: 'completed', 
          priority: 'High',
          creator: 'Mahlet',
          assignee: 'Tewodros'
        },
        { 
          id: '3-1-2', 
          title: 'GDPR-like compliance measures', 
          status: 'in-progress', 
          priority: 'Medium',
          creator: 'Tewodros',
          assignee: 'Mahlet'
        },
        { 
          id: '3-1-3', 
          title: 'Data leak prevention systems', 
          status: 'to-do', 
          priority: 'Medium',
          creator: 'Mahlet',
          assignee: 'Mahlet'
        },
        { 
          id: '3-1-4', 
          title: 'Incident response drills', 
          status: 'to-do', 
          priority: 'Low',
          creator: 'Tewodros',
          assignee: 'Mahlet'
        },
      ]
    }
  ]
};
