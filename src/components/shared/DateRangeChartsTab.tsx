
"use client"

import * as React from "react"
import { addDays, format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts"
import { Calendar as CalendarIcon, Users, Briefcase } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

const allData = Array.from({ length: 180 }, (_, i) => {
    const date = subDays(new Date(), i);
    const clientId = (i % 10) + 1; // Cycle through 10 clients
    const serviceId = (i % 3) + 1; // Cycle through 3 services
    return {
      date: format(date, "yyyy-MM-dd"),
      commissions: 1500 + Math.floor(Math.random() * 2000) + (i % 30) * 50,
      clientId: `client-${clientId}`,
      serviceId: `service-${serviceId}`,
    };
}).reverse();

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
}

interface DateRangeChartsTabProps extends React.HTMLAttributes<HTMLDivElement> {
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

export function DateRangeChartsTab({ className, clients, services }: DateRangeChartsTabProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  const [selectedClientId, setSelectedClientId] = React.useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("all");
  
  const presets = [
    { label: "Hoy", range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: "Ayer", range: { from: startOfYesterday(), to: endOfYesterday() } },
    { label: "Últimos 7 días", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Últimos 30 días", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "Este mes", range: { from: startOfMonth(new Date()), to: new Date() } },
    { label: "Mes pasado", range: { from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) } },
  ];
  
  const filteredData = React.useMemo(() => {
    return allData.filter(item => {
        const itemDate = new Date(item.date);
        const isDateInRange = date?.from && date.to ? (itemDate >= startOfDay(date.from) && itemDate <= endOfDay(date.to)) : true;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comisiones Generadas por Rango</CardTitle>
          <CardDescription>
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Seleccione un rango de fechas</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-2">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn("w-full md:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Calendario</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-2 border-b">
                            <div className="grid grid-cols-2 gap-1">
                                {presets.map(p => (
                                    <Button key={p.label} variant="ghost" size="sm" onClick={() => { setDate(p.range); }}>{p.label}</Button>
                                ))}
                            </div>
                        </div>
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={date?.from}
                          selected={date}
                          onSelect={setDate}
                          numberOfMonths={2}
                          locale={es}
                        />
                    </PopoverContent>
                </Popover>

                 <div className="flex flex-1 flex-col sm:flex-row gap-2">
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filtrar por cliente..."><Users className="mr-2 h-4 w-4 inline-block" /> Cliente</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Clientes</SelectItem>
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filtrar por servicio..."><Briefcase className="mr-2 h-4 w-4 inline-block" /> Servicio</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los Servicios</SelectItem>
                             {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

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
        </CardContent>
      </Card>
      
       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total en Rango</CardTitle>
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
            <CardTitle>Pico de Rendimiento</CardTitle>
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
            <CardTitle>Promedio Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${(average).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de comisiones por día en el rango.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
