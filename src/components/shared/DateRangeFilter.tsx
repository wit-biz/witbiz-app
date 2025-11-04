
"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Briefcase, FilterX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "../ui/separator"

interface DateRangeFilterProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
  clients: { id: string; name: string }[];
  services: { id: string; name: string }[];
  onClearFilters: () => void;
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
  onClearFilters,
}: DateRangeFilterProps) {
  const presets = [
    { label: "Hoy", range: { from: new Date(), to: new Date() } },
    { label: "Ayer", range: { from: startOfYesterday(), to: endOfYesterday() } },
    { label: "Últimos 7 días", range: { from: subDays(new Date(), 6), to: new Date() } },
    { label: "Últimos 30 días", range: { from: subDays(new Date(), 29), to: new Date() } },
    { label: "Este mes", range: { from: startOfMonth(new Date()), to: new Date() } },
    { label: "Mes pasado", range: { from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) } },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-full sm:w-auto justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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
              <span>Seleccione un rango</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex" align="start">
          <div className="flex flex-col gap-2 border-r p-4">
              {presets.map(p => (
                  <Button key={p.label} variant="ghost" size="sm" className="w-full justify-start" onClick={() => setDate(p.range)}>{p.label}</Button>
              ))}
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
      
      <Select value={selectedClientId} onValueChange={setSelectedClientId}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Cliente: Todos">
              <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> 
                  Cliente: {selectedClientId === 'all' ? 'Todos' : clients.find(c=> c.id === selectedClientId)?.name}
              </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Clientes</SelectItem>
          {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Servicio: Todos">
              <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Servicio: {selectedServiceId === 'all' ? 'Todos' : services.find(s=>s.id === selectedServiceId)?.name}
              </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los Servicios</SelectItem>
          {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="ghost" onClick={onClearFilters} size="icon">
          <FilterX className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Limpiar filtros</span>
      </Button>
    </div>
  );
}
