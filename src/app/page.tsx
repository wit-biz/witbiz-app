'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar as CalendarIcon } from 'lucide-react';
import { clients, tasks, workflowStages } from '@/lib/data';
import { Task } from '@/lib/types';
import { format, isToday, isPast, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

const statusColors: { [key in Task['status']]: string } = {
  'To-Do': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'In Progress':
    'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  Done: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  Overdue: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
};

function ClientListDialog({ stage }: { stage: string }) {
  const clientsInStage = clients.filter((client) => client.stage === stage);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full h-full text-left p-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg">{stage}</h3>
            <p className="text-sm text-muted-foreground">
              {clientsInStage.length} clients
            </p>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clients in "{stage}" Stage</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Assigned Owner</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsInStage.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.owner}</TableCell>
                <TableCell>{client.category}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function TodaysTasks() {
  const todaysTasks = tasks.filter((task) => isToday(task.dueDate));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
        <CardDescription>
          Your priorities for {format(new Date(), 'MMMM dd, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todaysTasks.length > 0 ? (
          <ul className="space-y-2">
            {todaysTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between p-2 rounded-md border"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Client: {task.clientName}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(statusColors[task.status])}
                >
                  {task.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No tasks due today. Enjoy!</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedStage, setHighlightedStage] = useState<string | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term) {
      const client = clients.find((c) =>
        c.name.toLowerCase().includes(term.toLowerCase())
      );
      setHighlightedStage(client ? client.stage : null);
    } else {
      setHighlightedStage(null);
    }
  };
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <TodaysTasks />

        <Card>
          <CardHeader>
            <CardTitle>CRM Flow</CardTitle>
            <CardDescription>
              Visualize your client lifecycle and search for clients.
            </CardDescription>
            <div className="relative pt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                className="pl-8"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workflowStages.map((stage) => (
                <Card
                  key={stage}
                  className={cn(
                    'transition-all',
                    highlightedStage === stage && 'ring-2 ring-primary'
                  )}
                >
                  <ClientListDialog stage={stage} />
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
