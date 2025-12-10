
"use client";

import React, { useRef } from 'react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Loader2, MapPin } from 'lucide-react';
import { Label } from '../ui/label';

const libraries: ('places')[] = ['places'];

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ value, onChange, disabled }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      onChange(place.formatted_address || place.name || '');
    }
  };

  if (loadError) {
    return (
        <div>
            <Label className="text-destructive text-xs">Error al cargar Google Maps</Label>
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Dirección de la cita o reunión"
                disabled={disabled}
            />
        </div>
    );
  }

  if (!isLoaded) {
    return (
        <div className="flex items-center gap-2 p-2 border rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Cargando mapa...</span>
        </div>
    );
  }

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['address'],
        componentRestrictions: { country: 'mx' }, // Restrict to Mexico
      }}
    >
        <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Escriba una dirección..."
                disabled={disabled}
                className="pl-10"
            />
        </div>
    </Autocomplete>
  );
};

export default LocationAutocompleteInput;
