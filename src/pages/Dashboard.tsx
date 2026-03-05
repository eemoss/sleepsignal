import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Wind,
  Activity,
  ArrowLeft,
  Settings,
  LogOut,
  User,
  Home as HomeIcon,
  AlertCircle,
  Clock,
  Circle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VitalsData {
  hr: number;
  br: number;
}

interface HistoryPoint {
  time: string;
  hr: number;
  br: number;
}

export default function Dashboard() {
  const { locationId } = useParams<{ locationId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sleepSignal, setSleepSignal] = useState<any>(null);
  const [vitals, setVitals] = useState<VitalsData>({ hr: 0, br: 0 });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [occupied, setOccupied] = useState(true);
  const [lastOccupied, setLastOccupied] = useState<Date | null>(null);
  const [timeSince, setTimeSince] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const isMock = searchParams.get('mock') === 'true';
  const mockOccupied = searchParams.get('occupied');

  useEffect(() => {
    if (isMock) {
      setLoading(false);
      const device = { id: 'mock-1', name: 'Demo Sleep Signal', type: 2021, connected: true };
      setSleepSignal(device);

      if (mockOccupied === 'false') {
        setOccupied(false);
        setLastOccupied(new Date(Date.now() - 125000)); // 2m 5s ago
      } else {
        setOccupied(true);
      }

      // Initial data for better screenshot
      const initialHistory: HistoryPoint[] = [];
      const now = new Date();
      for (let i = 20; i >= 0; i--) {
        const t = new Date(now.getTime() - i * 2000);
        initialHistory.push({
          time: t.toLocaleTimeString(),
          hr: 65 + Math.floor(Math.random() * 15),
          br: 14 + Math.floor(Math.random() * 6),
        });
      }
      setHistory(initialHistory);
      setVitals({ hr: initialHistory[20].hr, br: initialHistory[20].br });

      const interval = setInterval(() => {
        setVitals(prev => {
          const newHr = Math.max(40, Math.min(180, prev.hr + (Math.random() * 4 - 2)));
          const newBr = Math.max(8, Math.min(30, prev.br + (Math.random() * 2 - 1)));

          const hr = Math.round(newHr);
          const br = Math.round(newBr);

          setHistory(h => [...h.slice(-29), {
            time: new Date().toLocaleTimeString(),
            hr,
            br
          }]);

          return { hr, br };
        });
      }, 2000);

      // Toggle occupancy every 30 seconds for demo ONLY if not explicitly set
      let occInterval: any;
      if (mockOccupied === null) {
        occInterval = setInterval(() => {
          setOccupied(prev => {
            if (prev) setLastOccupied(new Date());
            return !prev;
          });
        }, 30000);
      }

      return () => {
        clearInterval(interval);
        if (occInterval) clearInterval(occInterval);
      };
    }

    async function init() {
      try {
        const data = await authService.getDevices(parseInt(locationId!));
        const devices = data.devices || [];
        const signal = devices.find((d: any) => d.type === 2021);

        if (!signal) {
          setSleepSignal(null);
          setLoading(false);
          return;
        }

        setSleepSignal(signal);

        // Setup WebSocket
        const { server, port, ssl } = await authService.getWsServer();
        const protocol = ssl ? 'wss' : 'ws';
        const ws = new WebSocket(`${protocol}://${server}:${port}/cloud/wsapi`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({
            action: 'authenticate',
            apiKey: localStorage.getItem('care_api_key')
          }));

          ws.send(JSON.stringify({
            action: 'subscribe',
            locationId: locationId,
            deviceId: signal.id
          }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.deviceId === signal.id) {
            const updates: any = {};
            data.parameters?.forEach((p: any) => {
              if (p.name === 'ppc.heartRate') updates.hr = parseInt(p.value);
              if (p.name === 'ppc.breathingRate') updates.br = parseInt(p.value);
              if (p.name === 'ppc.occupancyStatus') {
                const isOcc = parseInt(p.value) === 1;
                if (occupied && !isOcc) setLastOccupied(new Date());
                setOccupied(isOcc);
              }
            });

            if (updates.hr || updates.br) {
              setVitals(prev => ({
                hr: updates.hr || prev.hr,
                br: updates.br || prev.br
              }));
              setHistory(prev => [...prev.slice(-29), {
                time: new Date().toLocaleTimeString(),
                hr: updates.hr || (prev[prev.length-1]?.hr || 0),
                br: updates.br || (prev[prev.length-1]?.br || 0),
              }]);
            }
          }
        };

        setLoading(false);
      } catch (err) {
        setError('Failed to initialize dashboard');
        setLoading(false);
      }
    }

    init();
    return () => wsRef.current?.close();
  }, [locationId, isMock]);

  useEffect(() => {
    if (!occupied && lastOccupied) {
      const updateTimer = () => {
        const diff = Math.floor((new Date().getTime() - lastOccupied.getTime()) / 1000);
        if (diff < 60) setTimeSince(`${diff}s ago`);
        else if (diff < 3600) setTimeSince(`${Math.floor(diff/60)}m ago`);
        else setTimeSince(`${Math.floor(diff/3600)}h ago`);
      };
      updateTimer();
      const t = setInterval(updateTimer, 1000);
      return () => clearInterval(t);
    }
  }, [occupied, lastOccupied]);

  if (loading) return (
    <div className="min-h-screen bg-care-primary flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-care-accent"></div>
    </div>
  );

  if (!sleepSignal) return (
    <div className="min-h-screen bg-care-primary text-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-32 h-32 bg-care-secondary rounded-full flex items-center justify-center mb-8 border-4 border-dashed border-white/10">
        <AlertCircle size={64} className="text-care-accent opacity-50" />
      </div>
      <h1 className="text-4xl font-bold mb-4">No Sleep Signal Detected</h1>
      <p className="text-xl text-white/60 max-w-md mb-12">
        We don't yet have a Sleep Signal powered by Care Daily in this location.
      </p>
      <Link to="/locations" className="flex items-center gap-2 text-care-accent font-bold text-lg hover:underline">
        <ArrowLeft size={20} /> Switch Location
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-care-primary text-white font-sans selection:bg-care-accent/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-8 flex justify-between items-center bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/locations')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-care-accent uppercase">Care Daily</h1>
            <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase">Demo Experience</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Live Monitoring</span>
          </div>
          <button onClick={logout} className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5 group">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col p-8 gap-8 max-w-7xl mx-auto w-full">
        {occupied ? (
          <>
            <div className="grid grid-cols-2 gap-8">
              {/* Heartbeat Card */}
              <div className="bg-gradient-to-br from-care-secondary to-care-primary border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group transition-transform hover:scale-[1.02] duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Heart size={120} className="text-care-accent" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-care-accent/20 rounded-2xl">
                      <Heart className="text-care-accent" fill="#e94560" />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Heartbeat</h2>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-9xl font-black tracking-tighter tabular-nums">{vitals.hr}</span>
                    <span className="text-2xl font-bold text-white/40 uppercase tracking-widest">BPM</span>
                  </div>
                </div>
              </div>

              {/* Breathing Card */}
              <div className="bg-gradient-to-br from-care-secondary to-care-primary border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group transition-transform hover:scale-[1.02] duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Wind size={120} className="text-blue-400" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-blue-400/20 rounded-2xl">
                      <Wind className="text-blue-400" />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Breathing</h2>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-9xl font-black tracking-tighter tabular-nums">{vitals.br}</span>
                    <span className="text-2xl font-bold text-white/40 uppercase tracking-widest">RPM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Graph Area */}
            <div className="bg-care-secondary/50 border border-white/10 rounded-[40px] p-10 backdrop-blur-xl flex-grow flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-care-accent/10 rounded-xl">
                    <Activity className="text-care-accent" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Real-time Vitals</h3>
                </div>
                <div className="flex gap-8">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-care-accent shadow-[0_0_10px_rgba(233,69,96,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Heart Rate</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Respiration</span>
                  </div>
                </div>
              </div>

              <div className="flex-grow w-full relative">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e94560" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#e94560" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '15px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hr"
                      stroke="#e94560"
                      strokeWidth={5}
                      fillOpacity={1}
                      fill="url(#colorHr)"
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="br"
                      stroke="#60a5fa"
                      strokeWidth={5}
                      fillOpacity={1}
                      fill="url(#colorBr)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Standby / Empty State */
          <div className="flex-grow flex flex-col items-center justify-center p-12">
            <div className="relative mb-16">
              <div className="absolute inset-0 bg-care-accent/20 blur-[100px] rounded-full animate-pulse" />
              <div className="relative w-64 h-64 bg-care-secondary rounded-full flex items-center justify-center border-4 border-white/5 shadow-2xl">
                 <Circle size={120} className="text-white/10" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Activity size={64} className="text-care-accent animate-pulse" />
                 </div>
              </div>
            </div>

            <h2 className="text-6xl font-black mb-6 tracking-tighter">System Ready</h2>
            <div className="flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-3xl">
              <Clock className="text-white/40" />
              <span className="text-2xl font-bold text-white/60 tracking-tight">
                Left <span className="text-white">{timeSince || 'just now'}</span>
              </span>
            </div>

            <p className="mt-12 text-white/30 font-bold uppercase tracking-[0.3em] text-sm animate-bounce">
              Waiting for Presence
            </p>
          </div>
        )}
      </main>

      <footer className="p-12 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Powered by AI Ambient Assistants</p>
      </footer>
    </div>
  );
}
