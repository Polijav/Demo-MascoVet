import React from 'react';

interface VisualizerProps {
  inputVolume: number;
  outputVolume: number;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ inputVolume, outputVolume, isActive }) => {
  // We combine volumes or just show the dominant one
  const vol = Math.max(inputVolume, outputVolume);
  
  // Create a few bars for a waveform effect
  const bars = Array.from({ length: 5 });

  return (
    <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-teal-50 shadow-xl shadow-teal-100' : 'bg-slate-100'}`}>
      {/* Central Circle */}
      <div 
        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-100 z-10 ${isActive ? 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg' : 'bg-slate-300'}`}
        style={{
           transform: isActive ? `scale(${1 + vol * 0.4})` : 'scale(1)'
        }}
      >
        {isActive ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
           </svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
           </svg>
        )}
      </div>

      {/* Ripple Rings */}
      {isActive && (
        <>
          <div className="absolute inset-0 rounded-full border-2 border-teal-200 opacity-50 animate-ping" style={{ animationDuration: '2s' }}></div>
          <div className="absolute inset-0 rounded-full border border-teal-300 opacity-30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }}></div>
        </>
      )}
    </div>
  );
};

export default Visualizer;
