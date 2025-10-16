import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { tasks } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Task } from '@/lib/types';
import Image from 'next/image';

const statusColors = {
  'To-Do': 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  'In Progress': 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
  Done: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
};

function TaskTable({ tasksToShow }: { tasksToShow: Task[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Assigned To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasksToShow.map((task) => (
          <TableRow key={task.id}>
            <TableCell>
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-muted-foreground">
                {task.relatedTo.type}: {task.relatedTo.name}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={cn(statusColors[task.status])}>
                {task.status}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  new Date() > task.dueDate && task.status !== 'Done'
                    ? 'destructive'
                    : 'outline'
                }
              >
                {format(task.dueDate, 'MMM dd, yyyy')}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                   <Image
                      src={task.assignee.avatarUrl}
                      alt={task.assignee.name}
                      width={32}
                      height={32}
                      data-ai-hint="person face"
                    />
                  <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{task.assignee.name}</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function TasksPage() {
  const taskStatuses: Task['status'][] = ['To-Do', 'In Progress', 'Done'];
  const tabs = ['All', ...taskStatuses];
  
  const sortedTasks = [...tasks].sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Tasks">
        <Button>
          <PlusCircle className="mr-2" />
          Add Task
        </Button>
      </Header>
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="All" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="All">
            <Card>
              <CardContent className="pt-6">
                <TaskTable tasksToShow={sortedTasks} />
              </CardContent>
            </Card>
          </TabsContent>
          {taskStatuses.map((status) => (
             <TabsContent key={status} value={status}>
               <Card>
                 <CardContent className="pt-6">
                    <TaskTable tasksToShow={sortedTasks.filter(t => t.status === status)} />
                 </CardContent>
               </Card>
             </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
