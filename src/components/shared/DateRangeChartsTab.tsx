
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
    const clientId = `${(i % 10) + 1}`; 
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
  isComparative: boolean;
  clients: { id: string, name: string }[];
  services: { id: string, name: string }[];
}

const ChartCard = ({ title, data }: { title: string, data: any[] }) => {
    const { total, average, peak } = React.useMemo(() => {
        if (data.length === 0) {
            return { total: 0, average: 0, peak: { label: "N/A", value: 0 } };
        }
        const totalCommissions = data.reduce((acc, item) => acc + item.commissions, 0);
        const peakItem = data.reduce((max, item) => item.commissions > max.commissions ? item : max, data[0]);
        return {
            total: totalCommissions,
            average: totalCommissions / data.length,
            peak: { label: format(new Date(peakItem.date), "dd/MM/yy"), value: peakItem.commissions },
        };
    }, [data]);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Resumen del rendimiento para esta entidad.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data}>
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
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-bold">${total.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Pico</p>
                        <p className="font-bold">${peak.value.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Promedio Diario</p>
                        <p className="font-bold">${average.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export function DateRangeChartsTab({ className, date, selectedClientId, selectedServiceId, isComparative, clients, services }: DateRangeChartsTabProps) {
  
  const filteredData = React.useMemo(() => {
    return allData.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? isWithinInterval(itemDate, { start: startOfDay(date.from), end: endOfDay(date.to) }) : true;
        const isClientMatch = selectedClientId === 'all' || item.clientId === selectedClientId;
        const isServiceMatch = selectedServiceId === 'all' || item.serviceId === selectedServiceId;
        return isDateInRange && isClientMatch && isServiceMatch;
    })
  }, [date, selectedClientId, selectedServiceId]);
  
  // Logic for comparative view
  const comparativeCharts = React.useMemo(() => {
      if (!isComparative) return [];
      
      let itemsToCompare: { id: string, name: string }[] = [];
      let dataKey: 'serviceId' | 'clientId' = 'serviceId';

      if (selectedServiceId === 'all' && selectedClientId === 'all') {
          itemsToCompare = services;
          dataKey = 'serviceId';
      } else if (selectedServiceId !== 'all' && selectedClientId === 'all') {
          itemsToCompare = clients;
          dataKey = 'clientId';
      }

      if (itemsToCompare.length === 0) return [];
      
      return itemsToCompare.map(item => {
          const itemData = filteredData.filter(d => d[dataKey] === item.id);
          return {
              id: item.id,
              title: item.name,
              data: itemData,
          };
      }).filter(chart => chart.data.length > 0);

  }, [isComparative, filteredData, selectedClientId, selectedServiceId, clients, services]);

  const aggregatedMetrics = React.useMemo(() => {
    if (isComparative || filteredData.length === 0) {
      return { total: 0, average: 0, peak: { label: "N/A", value: 0 } };
    }
    const totalCommissions = filteredData.reduce((acc, item) => acc + item.commissions, 0);
    const peakItem = filteredData.reduce((max, item) => item.commissions > max.commissions ? item : max, filteredData[0]);
    return {
        total: totalCommissions,
        average: totalCommissions / filteredData.length,
        peak: { label: format(new Date(peakItem.date), "dd/MM/yy"), value: peakItem.commissions },
    };
  }, [filteredData, isComparative]);


  if (isComparative) {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {comparativeCharts.length > 0 ? (
                  comparativeCharts.map(chart => (
                      <ChartCard key={chart.id} title={chart.title} data={chart.data} />
                  ))
              ) : (
                  <div className="lg:col-span-2 text-center py-12 text-muted-foreground">
                      Seleccione "Todos" en Clientes o Servicios para activar la vista comparativa.
                  </div>
              )}
          </div>
      )
  }

  // AGGREGATED VIEW (DEFAULT)
  const { total, average, peak } = aggregatedMetrics;
  
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
