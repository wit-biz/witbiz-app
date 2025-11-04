
"use client"

import * as React from "react"
import { addDays, format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, startOfDay, endOfDay, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts"

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

const allData = Array.from({ length: 180 }, (_, i) => {
    const date = subDays(new Date(), i);
    const clientId = `client-${(i % 10) + 1}`; 
    const serviceId = `service-${(i % 3) + 1}`;
    return {
      date: format(date, "yyyy-MM-dd"),
      commissions: 1500 + Math.floor(Math.random() * 2000) + (i % 30) * 50,
      clientId: clientId,
      serviceId: serviceId,
    };
}).reverse();

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
}

interface DateRangeChartsTabProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined;
  selectedClientId: string;
  selectedServiceId: string;
}

export function DateRangeChartsTab({ className, date, selectedClientId, selectedServiceId }: DateRangeChartsTabProps) {
  
  const filteredData = React.useMemo(() => {
    return allData.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isClientMatch = selectedClientId === 'all' || item.clientId === `client-${selectedClientId}`;
        const isServiceMatch = selectedServiceId === 'all' || item.serviceId === `service-${selectedServiceId}`;
        return isDateInRange && isClientMatch && isServiceMatch;
    })
  }, [date, selectedClientId, selectedServiceId]);

  const { total, average, peak } = React.useMemo(() => {
    if (filteredData.length === 0) {
      return { total: 0, average: 0, peak: { label: "N/A", value: 0 } };
    }
    const totalCommissions = filteredData.reduce((acc, item) => acc + item.commissions, 0);
    const peakItem = filteredData.reduce((max, item) => item.commissions > max.commissions ? item : max, filteredData[0]);
    return {
        data: filteredData,
        total: totalCommissions,
        average: totalCommissions / filteredData.length,
        peak: { label: format(new Date(peakItem.date), "dd/MM/yy"), value: peakItem.commissions },
    };
  }, [filteredData]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
         <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={filteredData}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        tickMargin={10} 
                        axisLine={false} 
                        tickFormatter={(value) => format(new Date(value), "dd MMM", { locale: es })}
                    />
                    <YAxis />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                    <Bar dataKey="commissions" fill="var(--color-commissions)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Total en Rango</CardTitle>
            <CardDescription>Total generado en el período y filtros seleccionados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${total.toLocaleString()}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Pico de Rendimiento</CardTitle>
            <CardDescription>El día con mayores ingresos en el período.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {peak.label}
            </div>
            <p className="text-sm text-muted-foreground">
              ${peak.value.toLocaleString()} en comisiones.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Promedio Diario</CardTitle>
            <CardDescription>Promedio de ingresos por día en el período.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${(average).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
