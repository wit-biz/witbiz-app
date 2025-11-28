
"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

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
import { type Transaction } from "@/lib/types"

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "hsl(var(--primary))",
  },
  expense: {
    label: "Egresos",
    color: "hsl(var(--destructive))",
  },
}

interface DateRangeChartsTabProps {
  transactions: Transaction[];
}

export function DateRangeChartsTab({ transactions }: DateRangeChartsTabProps) {
  
  const aggregatedData = React.useMemo(() => {
    if (!transactions) return [];
    
    const dailyData: { [date: string]: { date: string, income: number, expense: number } } = {};

    transactions.forEach(t => {
      const date = format(new Date(t.date), "yyyy-MM-dd");
      if (!dailyData[date]) {
        dailyData[date] = { date, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dailyData[date].income += t.amount;
      } else if (t.type === 'expense') {
        dailyData[date].expense += Math.abs(t.amount); // Egresos como positivos para graficar
      }
    });

    return Object.values(dailyData).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);
  
  const { totalIncome, totalExpense, peak } = React.useMemo(() => {
    if (aggregatedData.length === 0) {
        return { totalIncome: 0, totalExpense: 0, peak: { label: "N/A", value: 0 } };
    }
    const totalIncome = aggregatedData.reduce((acc, item) => acc + item.income, 0);
    const totalExpense = aggregatedData.reduce((acc, item) => acc + item.expense, 0);
    const peakItem = aggregatedData.reduce((max, item) => item.income > max.income ? item : max, aggregatedData[0]);
    return {
        totalIncome,
        totalExpense,
        peak: { label: format(new Date(peakItem.date), "dd/MM/yy"), value: peakItem.income },
    };
  }, [aggregatedData]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
         <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={350}>
                <BarChart data={aggregatedData}>
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
                    <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Ingresos</CardTitle>
            <CardDescription>Total generado en el período y filtros seleccionados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Total Egresos</CardTitle>
            <CardDescription>Total gastado en el período y filtros seleccionados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              ${totalExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Utilidad Neta</CardTitle>
            <CardDescription>Diferencia entre ingresos y egresos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${(totalIncome - totalExpense).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
