/**
 * Ícones SVG animados das companhias aéreas
 * Componentes modernos e futuristas para cada companhia
 */

export const AirlineIcon = ({ airline, className = "w-6 h-6" }: { airline: string; className?: string }) => {
  switch (airline) {
    case "latam":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M30 50 L50 30 L70 50 L50 70 Z" fill="currentColor" className="transition-all duration-300" />
          <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.6" />
        </svg>
      );
    case "gol":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M50 20 L70 45 L60 50 L70 55 L50 80 L30 55 L40 50 L30 45 Z" fill="currentColor" className="transition-all duration-300" />
        </svg>
      );
    case "azul":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <rect x="35" y="35" width="30" height="30" rx="5" fill="currentColor" opacity="0.7" className="transition-all duration-300" />
          <circle cx="50" cy="50" r="12" fill="white" opacity="0.8" />
        </svg>
      );
    case "voepass":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M50 25 Q65 40 50 55 Q35 40 50 25" fill="currentColor" opacity="0.8" className="transition-all duration-300" />
          <path d="M50 55 Q65 60 50 75 Q35 60 50 55" fill="currentColor" opacity="0.5" />
        </svg>
      );
    case "onhappy":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <circle cx="40" cy="45" r="4" fill="currentColor" />
          <circle cx="60" cy="45" r="4" fill="currentColor" />
          <path d="M40 60 Q50 65 60 60" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="transition-all duration-300" />
        </svg>
      );
    case "kayak":
      return (
        <svg className={`${className} animate-pulse-glow`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="2" fill="none" className="transition-all duration-300" />
          <path d="M50 30 L60 50 L50 70 L40 50 Z" fill="currentColor" opacity="0.6" />
        </svg>
      );
    default:
      return (
        <svg className={`${className}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" opacity="0.3" />
          <path d="M50 25 L65 50 L50 75 L35 50 Z" fill="currentColor" opacity="0.7" />
        </svg>
      );
  }
};

export const AirlineIconSmall = ({ airline, className = "w-4 h-4" }: { airline: string; className?: string }) => {
  return <AirlineIcon airline={airline} className={className} />;
};
