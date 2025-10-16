import { Header } from '@/components/header';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { LeadsChart } from '@/components/dashboard/leads-chart';
import { TasksOverview } from '@/components/dashboard/tasks-overview';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AiTaskSuggester } from '@/components/leads/ai-task-suggester';
import { leads } from '@/lib/data';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <StatsCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Lead Funnel</CardTitle>
              <CardDescription>
                An overview of your current sales funnel.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <LeadsChart />
            </CardContent>
          </Card>
          <div className="col-span-4 lg:col-span-3 flex flex-col gap-4">
            <TasksOverview />
            <AiTaskSuggester leads={leads} />
          </div>
        </div>
      </main>
    </div>
  );
}
