"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useCRMData } from '@/contexts/CRMDataContext';
import { useAuth } from '@/firebase';
import { type TimeOffRequest } from '@/lib/types';

interface ApproveTimeOffDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDecisionMade: () => void;
  request?: TimeOffRequest;
}

export function ApproveTimeOffDialog({
  isOpen,
  onOpenChange,
  onDecisionMade,
}: ApproveTimeOffDialogProps) {
  const { currentUser } = useCRMData();
  const auth = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch pending requests when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen]);

  const fetchPendingRequests = async () => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');

      const response = await fetch('/api/users/time-off/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      } else {
        console.error('Error fetching pending requests');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !currentUser) return;

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');

      const response = await fetch('/api/users/time-off/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: 'approve',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al aprobar la solicitud');
      }

      onDecisionMade();
      setSelectedRequest(null);
      // Refresh pending requests
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !currentUser) return;

    if (rejectionReason.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debe proporcionar una razón para rechazar',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');

      const response = await fetch('/api/users/time-off/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: 'reject',
          reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al rechazar la solicitud');
      }

      onDecisionMade();
      setSelectedRequest(null);
      setRejectionReason('');
      // Refresh pending requests
      fetchPendingRequests();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestSelect = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setSelectedRequest(null);
        setRejectionReason('');
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aprobar Solicitudes de Tiempo Libre</DialogTitle>
          <DialogDescription>
            Revisa y aprueba o rechaza las solicitudes pendientes
          </DialogDescription>
        </DialogHeader>

        {!selectedRequest ? (
          // List of pending requests
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay solicitudes pendientes
              </p>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRequestSelect(request)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{request.userName}</span>
                        <Badge variant={request.type === 'libre' ? 'secondary' : 'destructive'}>
                          {request.type === 'libre' ? 'Día Libre' : 'Urgencia'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {request.dates.length === 1
                            ? format(new Date(request.dates[0]), 'd MMM yyyy', { locale: es })
                            : `${format(new Date(request.dates[0]), 'd MMM', { locale: es })} - ${format(
                                new Date(request.dates[request.dates.length - 1]),
                                'd MMM yyyy',
                                { locale: es }
                              )}`}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(request.requestedAt), 'd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Pendiente</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Selected request details
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{selectedRequest.userName}</span>
                  <Badge variant={selectedRequest.type === 'libre' ? 'secondary' : 'destructive'}>
                    {selectedRequest.type === 'libre' ? 'Día Libre' : 'Urgencia'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {selectedRequest.dates.length === 1
                      ? format(new Date(selectedRequest.dates[0]), 'd MMMM yyyy', { locale: es })
                      : `${selectedRequest.dates.length} días: ${format(
                          new Date(selectedRequest.dates[0]),
                          'd MMM',
                          { locale: es }
                        )} - ${format(new Date(selectedRequest.dates[selectedRequest.dates.length - 1]), 'd MMM yyyy', {
                          locale: es,
                        })}`}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection">Razón del rechazo (si aplica)</Label>
              <Textarea
                id="rejection"
                placeholder="Explica por qué estás rechazando esta solicitud..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {selectedRequest ? (
            <>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                disabled={isSubmitting}
              >
                Volver
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Rechazando...' : 'Rechazar'}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Aprobando...' : 'Aprobar'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
