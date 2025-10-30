
"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { format, subDays, startOfMonth, startOfYesterday, startOfDay, endOfDay } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateRangeFilterProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
}

export function DateRangeFilter({
  date,
  setDate,
  selectedClientId,
  setSelectedClientId,
  selectedServiceId,
  setSelectedServiceId,
  clients,
  services,
}: DateRangeFilterProps) {
  const presets = [
    { label: "Hoy", range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: "Ayer", range: { from: startOfYesterday(), to: endOfYesterday() } },
    { label: "Últimos 7 días", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Últimos 30 días", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "Este mes", range: { from: startOfMonth(new Date()), to: new Date() } },
    { label: "Mes pasado", range: { from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) } },
  ];

  return (
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
                <Button key={p.label} variant="ghost" size="sm" onClick={() => setDate(p.range)}>{p.label}</Button>
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
            <SelectValue placeholder="Filtrar por cliente...">
                <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Cliente</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar por servicio...">
                <span className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Servicio</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los Servicios</SelectItem>
            {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
