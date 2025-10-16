import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

export function TasksOverview() {
  const upcomingTasks = tasks
    .filter((task) => task.status !== 'Done')
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Tasks</CardTitle>
        <CardDescription>Your next most important actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {upcomingTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {task.relatedTo.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      new Date() > task.dueDate ? 'destructive' : 'outline'
                    }
                  >
                    {format(task.dueDate, 'MMM dd')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
