import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Thermometer, Network } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SystemMonitor = () => {
  const [stats, setStats] = useState({
    cpu: { usage: 0, temp: 0, history: [] },
    memory: { total: 0, used: 0, history: [] },
    network: { rx: 0, tx: 0, history: [] }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();

        setStats(prev => ({
          cpu: {
            usage: data.cpu.usage,
            temp: data.cpu.temperature,
            history: [...prev.cpu.history.slice(-29), {
              time: Date.now(),
              value: data.cpu.usage
            }]
          },
          memory: {
            total: data.memory.total,
            used: data.memory.used,
            history: [...prev.memory.history.slice(-29), {
              time: Date.now(),
              value: Math.round((data.memory.used / data.memory.total) * 100)
            }]
          },
          network: {
            rx: data.network.rx,
            tx: data.network.tx,
            history: [...prev.network.history.slice(-29), {
              time: Date.now(),
              rx: data.network.rx,
              tx: data.network.tx
            }]
          }
        }));
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    };

    // Initial fetch
    fetchStats();
    
    // Update every 2 seconds
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitor</h1>
        <div className="text-xl">{new Date().toLocaleTimeString()}</div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <Cpu className="w-8 h-8" />
            <div>
              <div className="text-4xl font-bold">{stats.cpu.usage}%</div>
              <div className="text-sm text-gray-400">CPU Usage</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <Thermometer className="w-8 h-8" />
            <div>
              <div className="text-4xl font-bold">{stats.cpu.temp}°C</div>
              <div className="text-sm text-gray-400">Temperature</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <HardDrive className="w-8 h-8" />
            <div>
              <div className="text-4xl font-bold">
                {Math.round((stats.memory.used / stats.memory.total) * 100)}%
              </div>
              <div className="text-sm text-gray-400">
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center space-x-4">
            <Network className="w-8 h-8" />
            <div>
              <div className="text-xl font-bold">↓{stats.network.rx} MB/s</div>
              <div className="text-sm font-bold">↑{stats.network.tx} MB/s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">CPU History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.cpu.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" 
                tickFormatter={time => new Date(time).toLocaleTimeString()} />
              <YAxis stroke="#9CA3AF" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} 
                labelFormatter={time => new Date(time).toLocaleTimeString()} />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" name="CPU %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Network History</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.network.history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF"
                tickFormatter={time => new Date(time).toLocaleTimeString()} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                labelFormatter={time => new Date(time).toLocaleTimeString()} />
              <Line type="monotone" dataKey="rx" stroke="#3B82F6" name="Download MB/s" />
              <Line type="monotone" dataKey="tx" stroke="#10B981" name="Upload MB/s" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
