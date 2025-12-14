"use client";

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Lightbulb, LightbulbOff, Sun, Palette, Power, Zap, CheckCircle2, X, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulbControlProps {
  deviceId: string;
  roomName: string;
}

const PRESET_COLORS = [
  "#ffffff", "#ffaa00", "#FF5733", "#3380FF", "#33FF57", "#A833FF"
];

export const BulbControl: React.FC<BulbControlProps> = ({ deviceId, roomName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOn, setIsOn] = useState(false); 
  const [color, setColor] = useState("#ffffff");
  const [brightness, setBrightness] = useState(100);
  const [mode, setMode] = useState<'daylight' | 'color'>('daylight');
  const [feedback, setFeedback] = useState(false);
  
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (newColor !== "#ffffff") setMode('color');
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBrightness(val);
    if (val === 0) setIsOn(false);
    else if (!isOn && val > 0) setIsOn(true);
  };

  const togglePower = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsOn(!isOn);
  };

  const toggleMode = (newMode: 'daylight' | 'color') => {
    setMode(newMode);
    if (newMode === 'daylight') {
        setColor("#ffffff");
        setBrightness(100);
        setFeedback(true);
        setTimeout(() => setFeedback(false), 2000);
    }
  };

  const bulbGlowStyle = {
    backgroundColor: isOn && brightness > 0 ? color : '#e5e7eb',
    boxShadow: isOn && brightness > 0
      ? `0 0 ${brightness}px ${brightness / 5}px ${color === '#ffffff' ? 'rgba(255,200,0,0.6)' : color + '90'}` 
      : 'none',
    transform: `scale(${isOn && brightness > 0 ? 1 + (brightness / 600) : 1})`,
    border: isOn && color === '#ffffff' ? '1px solid #ddd' : 'none'
  };

  const getIconColor = () => {
    if (!isOn || brightness === 0) return '#9ca3af'; 
    if ((color === '#ffffff' || color === '#ffaa00') && brightness > 50) return '#555'; 
    return '#fff';
  };

  if (!isOpen) {
    return (
      <div 
        onClick={() => setIsOpen(true)}
        className="group cursor-pointer bg-card/40 hover:bg-card/80 border border-border/50 hover:border-primary/50 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative overflow-hidden",
            isOn ? "bg-background shadow-inner" : "bg-muted"
          )}>
             <div 
               className="absolute inset-0 opacity-40 transition-colors duration-500"
               style={{ backgroundColor: isOn ? color : 'transparent' }} 
             />
             <Lightbulb 
               className={cn("w-6 h-6 z-10 transition-colors", isOn ? "text-foreground" : "text-muted-foreground")} 
               style={{ color: isOn ? color : undefined }}
             />
          </div>

          <div className="flex flex-col">
            <h4 className="font-semibold text-sm text-foreground">{roomName}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full", isOn ? "bg-green-500" : "bg-red-400")} />
              {isOn ? 'On' : 'Off'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={togglePower}
             className={cn(
               "p-2 rounded-full transition-all hover:scale-110 active:scale-95 z-20",
               isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
             )}
           >
             <Power className="w-4 h-4" />
           </button>
           
           <div className="p-2 text-muted-foreground group-hover:text-primary transition-colors">
              <Sliders className="w-4 h-4" />
           </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl px-4 animate-in zoom-in-95 duration-200">
        
        <button 
           onClick={() => setIsOpen(false)}
           className="absolute -top-12 right-4 text-white hover:text-primary transition-colors"
        >
           <div className="flex items-center gap-2">
             <span className="text-sm font-medium">Close Control</span>
             <div className="bg-white/10 p-2 rounded-full backdrop-blur-md">
               <X className="w-5 h-5" />
             </div>
           </div>
        </button>

        <div className="bg-white rounded-[24px] shadow-2xl border border-gray-100 p-6 w-full flex flex-col md:flex-row gap-6 relative overflow-hidden min-h-[350px]">
          
          <style jsx global>{`
            .react-colorful { width: 100%; height: 100%; min-height: 160px; border-radius: 16px; cursor: crosshair; position: relative; display: flex; flex-direction: column; }
            .react-colorful__saturation { position: relative; flex-grow: 1; border-radius: 16px 16px 0 0; border-bottom: 0; background-image: linear-gradient(to top, #000, rgba(0, 0, 0, 0)), linear-gradient(to right, #fff, rgba(255, 255, 255, 0)); }
            .react-colorful__pointer { position: absolute; z-index: 1; transform: translate(-50%, -50%); width: 24px; height: 24px; border-radius: 50%; background-color: #fff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); border: 2px solid #fff; cursor: pointer; }
            .react-colorful__hue { position: relative; height: 16px; border-radius: 0 0 16px 16px; margin-top: -2px; }
            .react-colorful__hue .react-colorful__pointer { width: 20px; height: 20px; border-width: 2px; }
          `}</style>

          <div className="flex-1 flex flex-col justify-between relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl text-gray-800">{roomName}</h3>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                  <span className={cn("w-2 h-2 rounded-full", isOn && brightness > 0 ? "bg-green-500" : "bg-red-400")}></span>
                  {isOn && brightness > 0 ? 'On' : 'Off'}
                </p>
              </div>
              <button
                onClick={togglePower}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-90",
                  isOn ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                )}
              >
                <Power className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center py-4">
              <div className="relative">
                  <div 
                    className="absolute inset-0 blur-3xl opacity-40 rounded-full transition-all duration-700"
                    style={{ backgroundColor: isOn && brightness > 0 ? color : 'transparent' }}
                  />
                  <div 
                    className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500"
                    style={bulbGlowStyle}
                  >
                    {brightness === 0 || !isOn ? (
                        <LightbulbOff className="w-12 h-12 text-gray-400 transition-colors" strokeWidth={1.5} />
                    ) : (
                        <Lightbulb 
                            className="w-12 h-12 transition-colors duration-300" 
                            style={{ color: getIconColor() }} 
                            strokeWidth={1.5} 
                        />
                    )}
                  </div>
              </div>
            </div>
          </div>

          <div className="hidden md:block w-[1px] bg-gray-100 my-2"></div>

          <div className="flex-1 flex flex-col gap-4 relative z-10">
            
            <div className="bg-gray-100 p-1 rounded-xl flex shrink-0">
              <button onClick={() => toggleMode('daylight')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all", mode === 'daylight' ? "bg-white shadow text-gray-900" : "text-gray-400")}>
                <Sun className="w-3 h-3" /> Daylight
              </button>
              <button onClick={() => toggleMode('color')} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all", mode === 'color' ? "bg-white shadow text-gray-900" : "text-gray-400")}>
                <Palette className="w-3 h-3" /> Color
              </button>
            </div>

            <div className="shrink-0">
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brightness</span>
                <span className="text-xs font-bold text-gray-700">{brightness}%</span>
              </div>
              <div className="relative w-full h-10 bg-gray-100 rounded-xl overflow-hidden group shadow-inner border border-gray-200">
                <div 
                  className="absolute top-0 left-0 h-full transition-all duration-100 ease-out"
                  style={{ 
                      width: `${brightness}%`, 
                      backgroundColor: isOn && brightness > 0 ? (mode === 'daylight' ? '#fbbf24' : color) : '#d1d5db', 
                      opacity: 1 
                  }}
                />
                <input 
                    type="range" min="0" max="100" step="5" 
                    value={brightness} onChange={handleBrightnessChange} 
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20" 
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-white/60 mix-blend-overlay">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[140px] relative w-full">
              {mode === 'color' ? (
                <div className="absolute inset-0 animate-in fade-in zoom-in duration-300 w-full h-full flex flex-col gap-2">
                    <div className="flex-1 w-full">
                        <HexColorPicker color={color} onChange={handleColorChange} style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div className="flex justify-between gap-1 shrink-0">
                        {PRESET_COLORS.map((preset, idx) => (
                            <button key={idx} onClick={() => handleColorChange(preset)} className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: preset }} />
                        ))}
                    </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 transition-all">
                  {feedback ? (
                      <div className="animate-in fade-in zoom-in duration-300 text-green-600 flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 mb-2" />
                          <span className="text-sm font-bold">Daylight Active</span>
                      </div>
                  ) : (
                      <>
                        <Sun className="w-10 h-10 mb-2 text-yellow-400 opacity-60" />
                        <span className="text-xs font-medium text-gray-400">Daylight Mode Active</span>
                        <span className="text-[10px] text-gray-300 mt-1">Standard White Light</span>
                      </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};