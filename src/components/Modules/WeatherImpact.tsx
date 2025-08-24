import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Wind, Thermometer, Droplets, Gauge, Eye, Download, AlertTriangle, Zap, Shield, Activity } from 'lucide-react';
import { useTurbineStore } from '../../store/turbineStore';

// Custom hook for API data
const usePowerLossData = () => {
  const [data, setData] = useState({
    forecast: [],
    summary: null,
    impact: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true }));
        
        // Fetch all required data
        const [forecastRes, summaryRes, impactRes] = await Promise.all([
          fetch('http://localhost:8000/api/forecast/next-6-hours'),
          fetch('http://localhost:8000/api/summary/power-loss'),
          fetch('http://localhost:8000/api/analysis/impact')
        ]);

        if (!forecastRes.ok || !summaryRes.ok || !impactRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const forecast = await forecastRes.json();
        const summary = await summaryRes.json();
        const impact = await impactRes.json();

        setData({
          forecast,
          summary,
          impact,
          loading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching power loss data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    fetchData();
    
    // Refresh data every 30 minutes
    const interval = setInterval(fetchData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

const WeatherImpact: React.FC = () => {
  const { currentData, weatherHistory } = useTurbineStore();
  const { forecast, summary, impact, loading, error } = usePowerLossData();

  const weather = currentData?.weather;

  const handleDownload48h = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/forecast/48-hours');
      const data = await response.json();
      
      // Convert to CSV and download
      const csvContent = [
        ['Time', 'Date', 'Power Loss (kW)', 'Wind Direction', 'Wind Speed'],
        ...data.predictions.map(p => [
          p.time,
          p.date,
          p.total_power_loss_kw,
          p.wind_direction,
          p.wind_speed
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '48h-power-loss-forecast.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Weather Metrics - Moved to top */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Wind className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-green-400">OPTIMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Wind Speed</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {currentData?.windSpeed.toFixed(1) || '0.0'}
              </span>
              <span className="text-slate-400 text-xs">m/s</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Thermometer className="w-5 h-5 text-red-400" />
            <span className="text-xs text-green-400">NORMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Temperature</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.temperature.toFixed(1) || '0.0'}
              </span>
              <span className="text-slate-400 text-xs">°C</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span className="text-xs text-green-400">NORMAL</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Humidity</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.humidity.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">%</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Gauge className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-green-400">STABLE</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Pressure</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.pressure.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">hPa</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Wind className="w-5 h-5 text-amber-400" />
            <span className="text-xs text-blue-400">SW</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Direction</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">
                {weather?.windDirection.toFixed(0) || '0'}
              </span>
              <span className="text-slate-400 text-xs">°</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800 rounded-xl p-4 border border-slate-700"
        >
          <div className="flex items-center justify-between mb-3">
            <Eye className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">CLEAR</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-slate-300 text-xs">Visibility</h3>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-bold text-white">15</span>
              <span className="text-slate-400 text-xs">km</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Power Loss Due to Wind Direction Change - Updated with real data */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Power Loss Due to Wind Direction Change</h2>
            <p className="text-slate-400">
              Predicted power loss analysis based on wind direction changes and turbine repositioning
            </p>
          </div>
          <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Next 6 Hours Forecast</h3>
              <button 
                onClick={handleDownload48h}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download 48h Report</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="text-slate-400 mt-2">Loading predictions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-400">Error loading data: {error}</p>
                </div>
              ) : (
                forecast.map((hour, index) => (
                  <motion.div
                    key={hour.time}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-center min-w-[60px]">
                        <div className="text-white font-semibold">{hour.time}</div>
                        <div className="text-slate-400 text-xs">{hour.hour_display}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300 text-xs">
                          {hour.wind_direction_from}° → {hour.wind_direction_to}°
                        </span>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-red-400 font-semibold">{Math.round(hour.power_loss_kw)} kW</div>
                      <div className="text-slate-400 text-xs">predicted loss</div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Summary Cards - Updated with real data */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Power Loss Summary</h4>
              
              {loading || error ? (
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                  <div className="text-center">
                    {loading ? (
                      <div className="animate-pulse text-slate-400">Loading summary...</div>
                    ) : (
                      <div className="text-red-400">Unable to load summary</div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-medium">Next 6 Hours</span>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {Math.round(summary?.next_6h_kw || 0)} kW
                    </div>
                    <div className="text-slate-400 text-sm">Total estimated power loss</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                      <div className="text-slate-400 text-xs mb-1">12 Hours</div>
                      <div className="text-white font-semibold">
                        {Math.round(summary?.next_12h_kw || 0)} kW
                      </div>
                    </div>
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3">
                      <div className="text-slate-400 text-xs mb-1">24 Hours</div>
                      <div className="text-white font-semibold">
                        {Math.round(summary?.next_24h_kw || 0)} kW
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Impact Metrics - Updated with real data */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Impact Analysis</h4>
              
              {loading || error || !impact ? (
                <div className="text-center py-4 text-slate-400">
                  {loading ? "Loading impact analysis..." : "Impact data unavailable"}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Avg. Repositioning Time</span>
                      <span className="text-white font-semibold">{impact.avg_repositioning_time}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: '35%' }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Direction Changes</span>
                      <span className="text-white font-semibold">{impact.direction_changes}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '60%' }} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Revenue Impact</span>
                      <span className="text-red-400 font-semibold">{impact.revenue_impact}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className="bg-red-400 h-2 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        {!loading && !error && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Enhanced predictions with turbine-specific wind corrections</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Lightning Risk Assessment */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Lightning Risk Assessment</h2>
            <p className="text-slate-400">
              48-hour lightning risk forecast in 6-hour intervals for wind farm operations
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
            <Zap className="w-8 h-8 text-amber-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              period: '0-6h',
              date: 'Today 14:00-20:00',
              riskLevel: 'HIGH',
              probability: 55.6,
              condition: 'Light Rain - Elevated Risk',
              precipitation: 1.5,
              wind: 4.1,
              actions: ['Full lightning safety protocols', 'Restrict outdoor maintenance', 'Move personnel indoors'],
              monitoring: '30 minutes',
              color: 'orange'
            },
            {
              period: '6-12h',
              date: 'Today 20:00-02:00',
              riskLevel: 'HIGH',
              probability: 71.7,
              condition: 'Heavy Rain, Low Wind - High Risk',
              precipitation: 8.5,
              wind: 3.2,
              actions: ['Full lightning safety protocols', 'Restrict outdoor maintenance', 'Move personnel indoors'],
              monitoring: '30 minutes',
              color: 'orange'
            },
            {
              period: '12-18h',
              date: 'Tomorrow 02:00-08:00',
              riskLevel: 'NORMAL',
              probability: 0.0,
              condition: 'Strong Wind, No Rain - Low Risk',
              precipitation: 0.0,
              wind: 11.5,
              actions: ['Continue standard operations', 'Routine monitoring', 'Standard maintenance'],
              monitoring: '6 hours',
              color: 'green'
            },
            {
              period: '18-24h',
              date: 'Tomorrow 08:00-14:00',
              riskLevel: 'NORMAL',
              probability: 0.0,
              condition: 'Clear Conditions - Low Risk',
              precipitation: 0.0,
              wind: 9.8,
              actions: ['Continue standard operations', 'Routine monitoring', 'Standard maintenance'],
              monitoring: '6 hours',
              color: 'green'
            }
          ].map((risk, index) => (
            <motion.div
              key={risk.period}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                risk.color === 'orange' 
                  ? 'bg-orange-400/10 border-orange-400/20' 
                  : 'bg-green-400/10 border-green-400/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold">{risk.period}</h3>
                  <p className="text-slate-400 text-xs">{risk.date}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  risk.color === 'orange' 
                    ? 'bg-orange-400/20 text-orange-400' 
                    : 'bg-green-400/20 text-green-400'
                }`}>
                  {risk.riskLevel}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-sm">Probability</span>
                    <span className={`font-semibold ${
                      risk.color === 'orange' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {risk.probability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        risk.color === 'orange' ? 'bg-orange-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${risk.probability}%` }}
                    />
                  </div>
                </div>

                <div className="text-slate-300 text-sm">
                  <p className="font-medium mb-1">{risk.condition}</p>
                  <div className="space-y-1 text-xs">
                    <p>Precipitation: {risk.precipitation} mm/h</p>
                    <p>Wind: {risk.wind} m/s</p>
                    <p>Monitoring: Every {risk.monitoring}</p>
                  </div>
                </div>

                <div>
                  <p className="text-slate-300 text-xs font-medium mb-2">Actions:</p>
                  <ul className="space-y-1">
                    {risk.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-slate-400 text-xs flex items-start">
                        <span className="w-1 h-1 bg-slate-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Power Loss Due to Wind Speed */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Power Loss Due to Wind Speed</h2>
            <p className="text-slate-400">
              Predicted power loss when wind speed is below 3 m/s or above 25 m/s (turbine shutdown conditions)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-400/10 border border-blue-400/20">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Wind Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-cyan-400/10 border border-cyan-400/20">
                <Wind className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Low Wind Conditions (&lt; 3 m/s)</h3>
                <p className="text-slate-400 text-sm">Turbine shutdown due to insufficient wind</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { time: '02:00', date: 'Tomorrow', windSpeed: 2.1, duration: '45 min', powerLoss: 890 },
                { time: '03:00', date: 'Tomorrow', windSpeed: 1.8, duration: '60 min', powerLoss: 1200 },
                { time: '04:00', date: 'Tomorrow', windSpeed: 2.5, duration: '30 min', powerLoss: 600 },
                { time: '05:00', date: 'Tomorrow', windSpeed: 2.9, duration: '15 min', powerLoss: 300 },
              ].map((period, index) => (
                <motion.div
                  key={period.time}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm">{period.time}</div>
                      <div className="text-slate-400 text-xs">{period.date}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-300 text-sm">{period.windSpeed} m/s</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-cyan-400 font-semibold text-sm">{period.powerLoss} kW</div>
                    <div className="text-slate-400 text-xs">{period.duration}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-400 font-medium">24h Low Wind Loss</span>
                <Wind className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">2,990 kW</div>
              <div className="text-slate-400 text-sm">Total power loss due to low wind</div>
            </div>
          </div>

          {/* High Wind Conditions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-lg bg-red-400/10 border border-red-400/20">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">High Wind Conditions (&gt; 25 m/s)</h3>
                <p className="text-slate-400 text-sm">Turbine shutdown for safety protection</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { time: '16:00', date: 'Tomorrow', windSpeed: 27.3, duration: '120 min', powerLoss: 2400 },
                { time: '17:00', date: 'Tomorrow', windSpeed: 29.1, duration: '90 min', powerLoss: 1800 },
                { time: '18:00', date: 'Tomorrow', windSpeed: 26.8, duration: '60 min', powerLoss: 1200 },
                { time: '19:00', date: 'Tomorrow', windSpeed: 25.5, duration: '30 min', powerLoss: 600 },
              ].map((period, index) => (
                <motion.div
                  key={period.time}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm">{period.time}</div>
                      <div className="text-slate-400 text-xs">{period.date}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-red-400" />
                      <span className="text-slate-300 text-sm">{period.windSpeed} m/s</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-semibold text-sm">{period.powerLoss} kW</div>
                    <div className="text-slate-400 text-xs">{period.duration}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-400 font-medium">24h High Wind Loss</span>
                <Shield className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">6,000 kW</div>
              <div className="text-slate-400 text-sm">Total power loss due to high wind</div>
            </div>
          </div>
        </div>

        {/* Combined Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Wind-Related Loss (24h)</div>
            <div className="text-2xl font-bold text-white">8,990 kW</div>
            <div className="text-slate-400 text-xs">Low wind + High wind combined</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Revenue Impact</div>
            <div className="text-2xl font-bold text-red-400">-$539.40</div>
            <div className="text-slate-400 text-xs">Based on $0.06/kWh</div>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Operational Efficiency</div>
            <div className="text-2xl font-bold text-amber-400">82.5%</div>
            <div className="text-slate-400 text-xs">Expected uptime percentage</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherImpact;