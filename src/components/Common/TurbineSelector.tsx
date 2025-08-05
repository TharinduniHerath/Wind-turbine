import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';

const TurbineSelector: React.FC = () => {
  const { selectedTurbine, setSelectedTurbine } = useTurbineStore();

  const turbines = [
    { id: 'Turbine-1', name: 'Turbine-1' },
    { id: 'Turbine-2', name: 'Turbine-2' },
    { id: 'Turbine-3', name: 'Turbine-3' },
  ];

  return (
    <div className="relative">
      <select
        value={selectedTurbine}
        onChange={(e) => setSelectedTurbine(e.target.value)}
        className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {turbines.map((turbine) => (
          <option key={turbine.id} value={turbine.id}>
            {turbine.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
};

export default TurbineSelector; 