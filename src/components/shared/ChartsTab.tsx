
"use client"

import * as React from "react"
import { Bar, BarChart, Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const monthlyData = [
  { month: "Ene", commissions: 1860 },
  { month: "Feb", commissions: 3050 },
  { month: "Mar", commissions: 2370 },
  { month: "Abr", commissions: 730 },
  { month: "May", commissions: 2090 },
  { month: "Jun", commissions: 2140 },
  { month: "Jul", commissions: 2500 },
  { month: "Ago", commissions: 1580 },
  { month: "Sep", commissions: 3100 },
  { month: "Oct", commissions: 2800 },
  { month: "Nov", commissions: 1900 },
  { month: "Dic", commissions: 3400 },
]

const yearlyData = [
    { year: "2022", commissions: 21500 },
    { year: "2023", commissions: 25800 },
    { year: "2024", commissions: 29300 },
];

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
}

type ChartView = "monthly" | "yearly";

export function ChartsTab() {
  const [view, setView] = React.useState<ChartView>("monthly");

  const { data, total, average, peak } = React.useMemo(() => {
    if (view === 'yearly') {
        const totalCommissions = yearlyData.reduce((acc, item) => acc + item.commissions, 0);
        const peakItem = yearlyData.reduce((max, item) => item.commissions > max.commissions ? item : max, yearlyData[0]);
        return {
            data: yearlyData,
            total: totalCommissions,
            average: totalCommissions / yearlyData.length,
            peak: { label: peakItem.year, value: peakItem.commissions },
        };
    }
    // Monthly view
    const totalCommissions = monthlyData.reduce((acc, item) => acc + item.commissions, 0);
    const peakItem = monthlyData.reduce((max, item) => item.commissions > max.commissions ? item : max, monthlyData[0]);
    return {
        data: monthlyData,
        total: totalCommissions,
        average: totalCommissions / 12,
        peak: { label: peakItem.month, value: peakItem.commissions },
    };
  }, [view]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Comisiones Generadas</CardTitle>
              <CardDescription>Resumen de comisiones generadas por {view === 'monthly' ? 'mes' : 'año'}.</CardDescription>
            </div>
            <Select value={view} onValueChange={(value) => setView(value as ChartView)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar Vista" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
            </Select>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            {view === 'monthly' ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <Bar dataKey="commissions" fill="var(--color-commissions)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
                 <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <Line type="monotone" dataKey="commissions" stroke="var(--color-commissions)" strokeWidth={2} dot={{r: 5, fill: "var(--color-commissions)"}} />
                    </LineChart>
                </ResponsiveContainer>
            )}
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total {view === 'monthly' ? 'Anual' : 'Global'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total generado en el período seleccionado.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>{view === 'monthly' ? 'Mes' : 'Año'} con Mayor Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {peak.label}
            </div>
            <p className="text-xs text-muted-foreground">
              ${peak.value.toLocaleString()} en comisiones.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Promedio {view === 'monthly' ? 'Mensual' : 'Anual'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${(average).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de comisiones por {view === 'monthly' ? 'mes' : 'año'}.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
