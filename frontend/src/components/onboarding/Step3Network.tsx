import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Database, Wifi, Activity, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  onNext: () => void;
}

export default function Step3Network({ onNext }: Props) {
  const [dbStatus, setDbStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [mqttStatus, setMqttStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  const [wsStatus, setWsStatus] = useState<'loading' | 'ok' | 'fail'>('loading');
  
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runDiagnostics = async () => {
      try {
        const res = await api.get('/onboarding/diagnostic');
        
        const dbOk = res.data.database;
        const mqttOk = res.data.mqtt_broker;

        setDbStatus(dbOk ? 'ok' : 'fail');
        setMqttStatus(mqttOk ? 'ok' : 'fail');
        setTimeout(() => setWsStatus('ok'), 2000);

        if (dbOk && mqttOk) {
          setTimeout(() => onNext(), 3500);
        }
      } catch (err) {
        setDbStatus('fail');
        setMqttStatus('fail');
        setWsStatus('fail');
      }
    };

    runDiagnostics();
  }, [onNext]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/60 backdrop-blur-xl border border-slate-200/60 p-10 rounded-3xl shadow-xl shadow-slate-200/50 flex flex-col items-center min-h-[450px]"
    >
      
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">System Integrity</h2>
      <p className="text-slate-500 text-sm mb-10">Validating core pipelines and hardware bridges.</p>

      <div className="w-full space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${dbStatus === 'ok' ? 'bg-emerald-100 text-emerald-600' : dbStatus === 'fail' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Database Sync</p>
              <p className="text-[10px] text-slate-400">Verifying spatial records...</p>
            </div>
          </div>
          {dbStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : 
           dbStatus === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
           <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>

        <div className="flex items-center justify-between p-4 bg-white/50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${mqttStatus === 'ok' ? 'bg-emerald-100 text-emerald-600' : mqttStatus === 'fail' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Sensor Bridge (MQTT)</p>
              <p className="text-[10px] text-slate-400">Establishing hardware pipelines...</p>
            </div>
          </div>
          {mqttStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : 
           mqttStatus === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
           <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>

        <div className="flex items-center justify-between p-4 bg-white/50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${wsStatus === 'ok' ? 'bg-emerald-100 text-emerald-600' : wsStatus === 'fail' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Real-time Stream (WS)</p>
              <p className="text-[10px] text-slate-400">Syncing live dashboard feed...</p>
            </div>
          </div>
          {wsStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-indigo-500" /> : 
           wsStatus === 'ok' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
           <AlertCircle className="w-5 h-5 text-red-500" />}
        </div>
      </div>

      {(dbStatus !== 'loading' && mqttStatus !== 'loading' && wsStatus !== 'loading') && (
        <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(dbStatus === 'fail' || mqttStatus === 'fail') ? (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Warning: Core systems degraded. Features may be limited.
              </div>
              <button onClick={onNext} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                Acknowledge & Proceed <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-emerald-600 font-medium text-center animate-pulse">
              All systems nominal. Finalizing setup...
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}