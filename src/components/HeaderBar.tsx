import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface HeaderBarProps {
  title: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title }) => {
  const [time, setTime] = useState(new Date());
  const [syncState, setSyncState] = useState<'synced' | 'syncing'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSyncStatus = (e: any) => {
      if (e.detail?.status === 'syncing') {
        setSyncState('syncing');
      } else if (e.detail?.status === 'synced') {
        setSyncState('synced');
        if (e.detail?.timestamp) {
          setLastSyncTime(e.detail.timestamp);
        }
      }
    };

    window.addEventListener('sisreserva_sync_realtime_status', handleSyncStatus);
    return () => window.removeEventListener('sisreserva_sync_realtime_status', handleSyncStatus);
  }, []);

  const formatMilitaryDate = (d: Date) => {
    const dias = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
    const diaSemana = dias[d.getDay()];
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const seg = String(d.getSeconds()).padStart(2, '0');

    return `${diaSemana}, ${dia}/${mes}, ${hora}:${min}:${seg}`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f281e] pb-3 mb-6 font-mono gap-2">
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
          {title}
        </h1>

        <span
          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase inline-flex items-center gap-1 border transition-colors ${
            syncState === 'syncing'
              ? 'bg-[#292211] border-[#7d5d1c] text-[#fcd34d]'
              : 'bg-[#121f14] border-[#294c28] text-[#86efac]'
          }`}
          title="Sincronização em tempo real: todas as movimentações são alocadas no banco de dados automaticamente"
        >
          {syncState === 'syncing' ? (
            <>
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              <span>GRAVANDO NA NUVEM...</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
              <span>NUVEM: TEMPO REAL {lastSyncTime ? `(${lastSyncTime})` : ''}</span>
            </>
          )}
        </span>
      </div>

      <div className="text-xs text-[#7a8c7b] font-medium tracking-wide">
        {formatMilitaryDate(time)}
      </div>
    </div>
  );
};

