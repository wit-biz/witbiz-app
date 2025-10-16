'use client';
import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { bookings } from '@/lib/data';
import { Booking } from '@/lib/types';
import { PlusCircle, Edit, Trash } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

function BookingDialog({
  booking,
  isOpen,
  onOpenChange,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking.title}</DialogTitle>
          <DialogDescription>
            Date: {format(booking.date, 'PPP')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>
            <strong>Client ID:</strong> {booking.clientId}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const bookingsForSelectedDay = selectedDate
    ? bookings.filter((booking) => isSameDay(booking.date, selectedDate as Date))
    : [];

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Bookings">
        <Button>
          <PlusCircle className="mr-2" />
          New Booking
        </Button>
      </Header>
      <main className="flex-1 grid md:grid-cols-3 gap-4 p-4 md:p-8">
        <div className="md:col-span-1">
          <Calendar
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasBooking: (date) => bookings.some(b => isSameDay(b.date, date))
            }}
            modifiersClassNames={{
              hasBooking: 'font-bold text-primary'
            }}
          />
        </div>
        <div className="md:col-span-2">
           <h2 className="text-xl font-bold mb-4">
            Bookings for {selectedDate ? format(selectedDate, 'PPP') : 'today'}
          </h2>
          {bookingsForSelectedDay.length > 0 ? (
            <ul className="space-y-2">
              {bookingsForSelectedDay.map((booking) => (
                <li
                  key={booking.id}
                  onClick={() => handleBookingClick(booking)}
                  className="p-3 border rounded-md cursor-pointer hover:bg-muted"
                >
                  <p className="font-semibold">{booking.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Client ID: {booking.clientId}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No bookings for this day.</p>
          )}
        </div>
      </main>
      <BookingDialog
        booking={selectedBooking}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
