import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Target, CircleDollarSign, Percent } from 'lucide-react';
import { leads } from '@/lib/data';

export function StatsCards() {
  const totalLeads = leads.length;
  const potentialRevenue = leads.reduce((acc, lead) => {
    if (lead.stage !== 'Lost') {
      return acc + lead.value;
    }
    return acc;
  }, 0);
  const wonLeads = leads.filter((lead) => lead.stage === 'Won').length;
  const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

  const stats = [
    {
      title: 'Total Leads',
      value: totalLeads.toString(),
      icon: <Target className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Potential Revenue',
      value: `$${(potentialRevenue / 1000).toFixed(0)}k`,
      icon: <CircleDollarSign className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Won Leads',
      value: `+${wonLeads}`,
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate.toFixed(1)}%`,
      icon: <Percent className="h-5 w-5 text-muted-foreground" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
