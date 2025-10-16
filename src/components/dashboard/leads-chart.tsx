'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { leads } from '@/lib/data';
import {
  ChartTooltip,
  ChartTooltipContent,
  ChartContainer,
} from '@/components/ui/chart';

const leadStages: ('New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost')[] = [
  'New',
  'Contacted',
  'Proposal',
  'Negotiation',
  'Won',
];

const chartData = leadStages.map((stage) => ({
  name: stage,
  total: leads.filter((lead) => lead.stage === stage).length,
  fill: 'hsl(var(--primary))',
}));

const chartConfig = {
  total: {
    label: 'Leads',
  },
};

export function LeadsChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
