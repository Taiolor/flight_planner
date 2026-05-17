import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ShareByEmailButtonProps {
  weekNumber: number;
  departureAirport: string;
  returnAirport: string;
  departureDate: string;
  returnDate: string;
  departureFlightNumber: string;
  returnFlightNumber: string;
  departureAirline: string;
  returnAirline: string;
  departurePNR: string;
  returnPNR: string;
  departureDatetime: string;
  returnDatetime: string;
}

export function ShareByEmailButton({
  weekNumber,
  departureAirport,
  returnAirport,
  departureDate,
  returnDate,
  departureFlightNumber,
  returnFlightNumber,
  departureAirline,
  returnAirline,
  departurePNR,
  returnPNR,
  departureDatetime,
  returnDatetime,
}: ShareByEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const shareByEmailMutation = trpc.ticketNotifications.shareByEmail.useMutation();

  const handleShareByEmail = async () => {
    // Validar se há dados de bilhete preenchidos
    if (!departureFlightNumber || !returnFlightNumber) {
      toast.error('Preencha os dados de ida e volta antes de compartilhar');
      return;
    }

    setIsLoading(true);
    try {
      await shareByEmailMutation.mutateAsync({
        weekNumber,
        departureAirport,
        returnAirport,
        departureDate,
        returnDate,
        departureFlightNumber,
        returnFlightNumber,
        departureAirline,
        returnAirline,
        departurePNR,
        returnPNR,
        departureDatetime,
        returnDatetime,
      });
      toast.success('E-mail compartilhado com sucesso!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao compartilhar por e-mail';
      toast.error(errorMessage);
      console.error('Erro ao compartilhar por e-mail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleShareByEmail}
      disabled={isLoading || !departureFlightNumber || !returnFlightNumber}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      <Mail className="w-4 h-4 mr-2" />
      {isLoading ? 'Enviando...' : '📧 Compartilhar por E-Mail'}
    </Button>
  );
}
