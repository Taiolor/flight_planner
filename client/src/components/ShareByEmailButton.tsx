import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface ShareByEmailButtonProps {
  weekNumber: number;
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
      // Extrair hora do datetime (formato: "YYYY-MM-DD HH:mm")
      const extractTime = (datetime: string): string => {
        if (!datetime) return '';
        // Formato esperado: YYYY-MM-DD HH:mm (hora está na posição 11-16)
        if (datetime.length >= 16) {
          return datetime.slice(11, 16);
        }
        // Fallback: tentar split por espaço
        const parts = datetime.split(' ');
        if (parts.length > 1) {
          return parts[1].split(':').slice(0, 2).join(':');
        }
        return '';
      };

      const weekLabel = `Semana ${weekNumber}`;
      const departureTime = extractTime(departureDatetime);
      const returnTime = extractTime(returnDatetime);

      const result = await shareByEmailMutation.mutateAsync({
        weekNumber,
        weekLabel,
        departureDate,
        departureTime,
        departureAirport: 'GRU',
        departureAirline,
        departureFlightNumber,
        departureLocator: departurePNR,
        returnDate,
        returnTime,
        returnAirport: 'NVT',
        returnAirline,
        returnFlightNumber,
        returnLocator: returnPNR,
      });
      
      if (result) {
        toast.success('✅ E-mail compartilhado com sucesso!', {
          description: `Bilhetes da ${weekLabel} foram enviados para os e-mails cadastrados.`,
          duration: 4000,
        });
      } else {
        toast.error('❌ Erro ao enviar e-mail', {
          description: 'Verifique se há e-mails cadastrados e tente novamente.',
          duration: 4000,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao compartilhar por e-mail';
      toast.error('❌ Erro ao enviar e-mail', {
        description: errorMessage,
        duration: 5000,
      });
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
