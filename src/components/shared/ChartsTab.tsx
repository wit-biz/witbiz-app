
"use client"

import * as React from "react"
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

const chartData = [
  { month: "Enero", commissions: 1860 },
  { month: "Febrero", commissions: 3050 },
  { month: "Marzo", commissions: 2370 },
  { month: "Abril", commissions: 730 },
  { month: "Mayo", commissions: 2090 },
  { month: "Junio", commissions: 2140 },
  { month: "Julio", commissions: 2500 },
  { month: "Agosto", commissions: 1580 },
  { month: "Septiembre", commissions: 3100 },
  { month: "Octubre", commissions: 2800 },
  { month: "Noviembre", commissions: 1900 },
  { month: "Diciembre", commissions: 3400 },
]

const chartConfig = {
  commissions: {
    label: "Comisiones",
    color: "hsl(var(--primary))",
  },
}

export function ChartsTab() {
  const totalCommissions = React.useMemo(() => {
    return chartData.reduce((acc, item) => acc + item.commissions, 0)
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comisiones Mensuales</CardTitle>
          <CardDescription>Resumen de comisiones generadas por mes durante el último año.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="commissions" fill="var(--color-commissions)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Comisión Anual Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${totalCommissions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total generado en los últimos 12 meses.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Mes con Mayor Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              Diciembre
            </div>
            <p className="text-xs text-muted-foreground">
              $3,400 en comisiones.
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Promedio Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              ${(totalCommissions / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio de comisiones por mes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
