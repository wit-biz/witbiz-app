export type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  avatarUrl: string;
};

export type Lead = {
  id: string;
  name: string;
  company: string;
  stage: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  value: number;
  contactId: string;
  description: string;
  recentActivities: string;
};

export type Task = {
  id: string;
  title: string;
  dueDate: Date;
  status: 'To-Do' | 'In Progress' | 'Done';
  assignee: {
    name: string;
    avatarUrl: string;
  };
  relatedTo: {
    type: 'Lead' | 'Contact';
    name: string;
  };
};
