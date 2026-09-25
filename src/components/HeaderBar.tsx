import React, { useState, useEffect } from 'react';

interface HeaderBarProps {
  title: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    <div className="flex items-center justify-between border-b border-[#1f281e] pb-3 mb-6 font-mono">
      <h1 className="text-base sm:text-lg font-bold tracking-wider text-white uppercase">
        {title}
      </h1>

      <div className="text-xs text-[#7a8c7b] font-medium tracking-wide">
        {formatMilitaryDate(time)}
      </div>
    </div>
  );
};
