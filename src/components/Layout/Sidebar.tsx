import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Zap, 
  CloudRain, 
  Settings
} from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';
import { ActiveModule } from '../../types';

const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule } = useTurbineStore();

  const navigationItems = [
    { id: 'overview' as ActiveModule, label: 'Overview', icon: Home },
    { id: 'power' as ActiveModule, label: 'Power Optimize', icon: Zap },
    { id: 'weather' as ActiveModule, label: 'Weather Impact', icon: CloudRain },
    { id: 'maintenance' as ActiveModule, label: 'Maintenance', icon: Settings },
  ];

  return (
    <div className="bg-slate-800 w-64 h-full flex flex-col border-r border-slate-700">
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => {
                  console.log('🔧 Sidebar navigation clicked:', item.id);
                  setActiveModule(item.id);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;