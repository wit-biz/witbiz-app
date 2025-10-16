'use client';
import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Calendar } from '@/components/ui/calendar';
import { tasks } from '@/lib/data';
import { Task } from '@/lib/types';
import { Edit, Trash } from 'lucide-react';
import { format, isSameDay, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

function TaskDialog({
  task,
  isOpen,
  onOpenChange,
}: {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
          <DialogDescription>
            Due: {format(task.dueDate, 'PPP')} | Status: {task.status}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            <strong>Client:</strong> {task.clientName}
          </p>
          <p>
            <strong>Details:</strong> This is a placeholder for task details.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button>Mark as Completed</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskList({
  tasks,
  onTaskClick,
}: {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          onClick={() => onTaskClick(task)}
          className="p-3 border rounded-md cursor-pointer hover:bg-muted"
        >
          <p className="font-semibold">{task.title}</p>
          <p className="text-sm text-muted-foreground">
            Client: {task.clientName}
          </p>
          <p
            className={cn(
              'text-sm',
              isPast(task.dueDate) && task.status !== 'Done'
                ? 'text-red-500'
                : 'text-muted-foreground'
            )}
          >
            Due: {format(task.dueDate, 'MMM dd, yyyy')}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default function TasksPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const overdueTasks = tasks.filter(
    (task) => isPast(task.dueDate) && task.status !== 'Done'
  );
  const todayTasks = tasks.filter((task) =>
    isSameDay(task.dueDate, new Date()) && task.status !== 'Done'
  );
  const upcomingTasks = tasks.filter(
    (task) =>
      !isPast(task.dueDate) &&
      !isToday(task.dueDate) &&
      task.status !== 'Done'
  );
  
  const tasksForSelectedDay = selectedDate ? tasks.filter(task => isSameDay(task.dueDate, selectedDate as Date)) : [];

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };
  
  const dateHasTasks = (date: Date) => {
    const hasTask = tasks.some(d => isSameDay(d.dueDate, date));
    if (!hasTask) return '';
    
    const isOverdue = tasks.some(t => isSameDay(t.dueDate, date) && isPast(t.dueDate) && t.status !== 'Done');
    if (isOverdue) return 'text-red-500';

    const isTodayTask = tasks.some(t => isSameDay(t.dueDate, date) && isToday(t.dueDate));
    if (isTodayTask) return 'text-green-500';

    return 'text-blue-500';
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Tasks Management" />
      <main className="flex-1 grid md:grid-cols-3 gap-4 p-4 md:p-8">
        <div className="md:col-span-1">
          <Calendar
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
             modifiers={{
              hasTasks: (date) => tasks.some(d => isSameDay(d.dueDate, date))
            }}
            modifiersClassNames={{
              hasTasks: 'font-bold'
            }}
          />
        </div>
        <div className="md:col-span-2">
          {selectedDate ? (
            <div>
              <h2 className="text-xl font-bold mb-4">Tasks for {format(selectedDate, 'PPP')}</h2>
              {tasksForSelectedDay.length > 0 ? (
                <TaskList tasks={tasksForSelectedDay} onTaskClick={handleTaskClick} />
              ) : (
                <p>No tasks for this day.</p>
              )}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={['today', 'overdue']} className="w-full">
              <AccordionItem value="overdue">
                <AccordionTrigger>
                  Overdue Tasks ({overdueTasks.length})
                </AccordionTrigger>
                <AccordionContent>
                  <TaskList tasks={overdueTasks} onTaskClick={handleTaskClick} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="today">
                <AccordionTrigger>
                  Today's Tasks ({todayTasks.length})
                </AccordionTrigger>
                <AccordionContent>
                  <TaskList tasks={todayTasks} onTaskClick={handleTaskClick} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="upcoming">
                <AccordionTrigger>
                  Upcoming Tasks ({upcomingTasks.length})
                </AccordionTrigger>
                <AccordionContent>
                  <TaskList tasks={upcomingTasks} onTaskClick={handleTaskClick} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </main>
      <TaskDialog
        task={selectedTask}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
