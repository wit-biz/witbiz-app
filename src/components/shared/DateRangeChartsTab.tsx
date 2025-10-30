
"use client"

import * as React from "react"
import { addDays, format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts"
import { Calendar as CalendarIcon } from "lucide-react"

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
    return {
      date: format(date, "yyyy-MM-dd"),
      commissions: 1500 + Math.floor(Math.random() * 2000) + (i % 30) * 50,
    };
}).reverse();

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
}

export function DateRangeChartsTab({ className }: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  })
  
  const presets = [
    { label: "Hoy", range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: "Ayer", range: { from: startOfYesterday(), to: endOfYesterday() } },
    { label: "Últimos 7 días", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Últimos 30 días", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "Este mes", range: { from: startOfMonth(new Date()), to: new Date() } },
    { label: "Mes pasado", range: { from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) } },
  ];
  
  const filteredData = React.useMemo(() => {
    if (!date?.from || !date.to) return [];
    return allData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startOfDay(date.from!) && itemDate <= endOfDay(date.to!);
    })
  }, [date]);

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
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
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
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                <div className="grid grid-cols-3 sm:flex gap-1 w-full sm:w-auto">
                    {presets.slice(0, 3).map(p => (
                        <Button key={p.label} variant="outline" size="sm" onClick={() => setDate(p.range)}>{p.label}</Button>
                    ))}
                </div>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span>Calendario</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="p-2 border-b">
                            <div className="grid grid-cols-3 gap-1">
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
            </div>
        </CardHeader>
        <CardContent>
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
