import type { Contact, Lead, Task } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getAvatar = (id: string) =>
  PlaceHolderImages.find((img) => img.id === id)?.imageUrl ||
  'https://picsum.photos/seed/default/40/40';

export const contacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    phone: '123-456-7890',
    company: 'Innovate Inc.',
    avatarUrl: getAvatar('avatar1'),
  },
  {
    id: '2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    phone: '234-567-8901',
    company: 'Synergy Corp.',
    avatarUrl: getAvatar('avatar2'),
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    phone: '345-678-9012',
    company: 'Solutions LLC',
    avatarUrl: getAvatar('avatar3'),
  },
  {
    id: '4',
    name: 'Diana Miller',
    email: 'diana.m@example.com',
    phone: '456-789-0123',
    company: 'TechPro',
    avatarUrl: getAvatar('avatar4'),
  },
  {
    id: '5',
    name: 'Ethan Davis',
    email: 'ethan.d@example.com',
    phone: '567-890-1234',
    company: 'Global Net',
    avatarUrl: getAvatar('avatar5'),
  },
];

export const leads: Lead[] = [
  {
    id: 'L1',
    name: 'Innovate Inc. Website Redesign',
    company: 'Innovate Inc.',
    stage: 'Proposal',
    value: 75000,
    contactId: '1',
    description: 'Lead for a complete overhaul of their corporate website and e-commerce platform.',
    recentActivities: 'Sent initial proposal on Monday. Follow-up meeting scheduled for next week.',
  },
  {
    id: 'L2',
    name: 'Synergy Corp. Cloud Migration',
    company: 'Synergy Corp.',
    stage: 'Negotiation',
    value: 120000,
    contactId: '2',
    description: 'Migrating their on-premise servers to a cloud infrastructure. High priority project.',
    recentActivities: 'Completed technical review. Now in price negotiation phase with their procurement team.',
  },
  {
    id: 'L3',
    name: 'Solutions LLC Marketing Campaign',
    company: 'Solutions LLC',
    stage: 'New',
    value: 25000,
    contactId: '3',
    description: 'New inbound lead from our website, interested in a digital marketing campaign.',
    recentActivities: 'Lead form submitted on the website. Initial contact not yet made.',
  },
  {
    id: 'L4',
    name: 'TechPro Mobile App',
    company: 'TechPro',
    stage: 'Contacted',
    value: 95000,
    contactId: '4',
    description: 'Developing a new customer-facing mobile application for iOS and Android.',
    recentActivities: 'Had a discovery call last week. Client is reviewing our capabilities deck.',
  },
  {
    id: 'L5',
    name: 'Global Net Security Audit',
    company: 'Global Net',
    stage: 'Won',
    value: 40000,
    contactId: '5',
    description: 'A comprehensive security audit of their internal network and systems.',
    recentActivities: 'Contract signed. Project kickoff meeting is scheduled.',
  },
    {
    id: 'L6',
    name: 'Enterprise Software Subscription',
    company: 'Data Systems',
    stage: 'Lost',
    value: 60000,
    contactId: '2',
    description: 'Annual subscription for our enterprise software suite.',
    recentActivities: 'Client chose a competitor solution due to pricing.',
  },
];

export const tasks: Task[] = [
  {
    id: 'T1',
    title: 'Follow up on Innovate Inc. proposal',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    status: 'To-Do',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Lead', name: 'Innovate Inc. Website Redesign' },
  },
  {
    id: 'T2',
    title: 'Prepare negotiation documents for Synergy',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
    status: 'In Progress',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Lead', name: 'Synergy Corp. Cloud Migration' },
  },
  {
    id: 'T3',
    title: 'Initial outreach to Solutions LLC',
    dueDate: new Date(),
    status: 'To-Do',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Lead', name: 'Solutions LLC Marketing Campaign' },
  },
  {
    id: 'T4',
    title: 'Schedule TechPro technical demo',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    status: 'To-Do',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Lead', name: 'TechPro Mobile App' },
  },
  {
    id: 'T5',
    title: 'Onboard Global Net for security audit',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    status: 'In Progress',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Lead', name: 'Global Net Security Audit' },
  },
    {
    id: 'T6',
    title: 'Quarterly check-in with Alice',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
    status: 'Done',
    assignee: { name: 'You', avatarUrl: getAvatar('user-avatar') },
    relatedTo: { type: 'Contact', name: 'Alice Johnson' },
  },
];
