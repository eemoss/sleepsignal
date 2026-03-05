import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Home, LogOut, ChevronRight, Loader2, MapPin } from 'lucide-react';

interface Location {
  id: number;
  name: string;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await authService.getUserInfo();
        if (data.resultCode === 0) {
          setLocations(data.locations || []);
        } else {
          setError(data.resultCodeMessage || 'Failed to fetch locations');
        }
      } catch (err: any) {
        setError('An error occurred while fetching locations');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleSelectLocation = (id: number) => {
    navigate(`/dashboard/${id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center italic font-bold">CD</div>
          <h1 className="text-xl font-bold">Locations</h1>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all"
          title="Logout"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 animate-pulse">Loading your homes...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 space-y-4">
            <div className="text-red-400 bg-red-950/30 border border-red-900/50 p-4 rounded-xl inline-block">
              {error}
            </div>
            <button onClick={() => window.location.reload()} className="block mx-auto text-blue-400 hover:text-blue-300 underline">Try again</button>
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-slate-700" />
            </div>
            <h2 className="text-2xl font-semibold">No locations found</h2>
            <p className="text-slate-500 max-w-xs mx-auto">You don't seem to have any homes configured in your Care Daily account.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelectLocation(loc.id)}
                className="group flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/50 transition-all text-left shadow-lg hover:shadow-blue-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 group-hover:bg-blue-600/20 rounded-xl flex items-center justify-center transition-colors">
                    <MapPin className="w-6 h-6 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{loc.name}</h3>
                    <p className="text-slate-500 text-sm">Location ID: {loc.id}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-blue-400 transition-colors translate-x-0 group-hover:translate-x-1 duration-300" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
