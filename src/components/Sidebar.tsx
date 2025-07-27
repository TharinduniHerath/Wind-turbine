import React from 'react';
import { Volume2, Zap, CloudRain, Calendar } from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    {
      id: 'noise',
      label: 'Noise Monitoring',
      icon: Volume2,
      description: 'Acoustic analysis',
    },
    {
      id: 'power',
      label: 'Power Optimization',
      icon: Zap,
      description: 'Performance tuning',
    },
    {
      id: 'weather',
      label: 'Weather Impact',
      icon: CloudRain,
      description: 'Environmental data',
    },
    {
      id: 'maintenance',
      label: 'Maintenance Schedule',
      icon: Calendar,
      description: 'Service planning',
    },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">System Modules</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-200' : 'text-gray-500'}`} />
                <div>
                  <p className={`font-medium ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  <p className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;