import { useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  /** Distância mínima em px para acionar o refresh (padrão: 80) */
  threshold?: number;
  /** Distância máxima de arrasto em px (padrão: 120) */
  maxPull?: number;
  /** Callback chamado quando o refresh é acionado */
  onRefresh: () => void | Promise<void>;
}

interface PullToRefreshState {
  /** Distância atual de arrasto (0 a maxPull) */
  pullDistance: number;
  /** true enquanto o refresh está sendo executado */
  isRefreshing: boolean;
  /** true quando o usuário está arrastando */
  isPulling: boolean;
}

/**
 * Hook que implementa pull-to-refresh nativo para mobile.
 * Detecta o gesto de puxar para baixo quando a página está no topo,
 * exibe um indicador visual e chama onRefresh quando o threshold é atingido.
 */
export function usePullToRefresh({
  threshold = 80,
  maxPull = 120,
  onRefresh,
}: PullToRefreshOptions): PullToRefreshState {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Só inicia o pull se estiver no topo da página
      if (window.scrollY > 0) return;
      startYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      if (isRefreshingRef.current) return;
      if (window.scrollY > 0) {
        startYRef.current = null;
        return;
      }

      const currentY = e.touches[0].clientY;
      const delta = currentY - startYRef.current;

      if (delta <= 0) {
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      // Resistência progressiva: quanto mais puxa, mais difícil fica
      const resistance = 0.45;
      const distance = Math.min(delta * resistance, maxPull);

      setPullDistance(distance);
      setIsPulling(true);

      // Previne o scroll nativo apenas quando está puxando para baixo no topo
      if (delta > 0 && window.scrollY === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (startYRef.current === null) return;
      startYRef.current = null;

      if (isRefreshingRef.current) return;

      if (pullDistance >= threshold) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        setIsPulling(false);
        setPullDistance(0);

        try {
          await onRefresh();
        } finally {
          // Pequeno delay para o usuário ver o indicador
          await new Promise(r => setTimeout(r, 600));
          isRefreshingRef.current = false;
          setIsRefreshing(false);
        }
      } else {
        // Não atingiu o threshold — rebote de volta
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, maxPull, onRefresh, pullDistance]);

  return { pullDistance, isRefreshing, isPulling };
}
