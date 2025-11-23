import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import Visualizer from './components/Visualizer';
import { ConnectionState } from './types';

const App: React.FC = () => {
  const { connectionState, connect, disconnect, volume, error } = useGeminiLive();

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="bg-teal-600 text-white p-2 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight">Clínica MascoVet</h1>
               <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Madrid, España</p>
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
            <span className="text-sm font-medium text-slate-600">
              {isConnected ? 'En línea' : isConnecting ? 'Conectando...' : 'Desconectado'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
           <div className="absolute top-10 left-10 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
           <div className="absolute top-10 right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-8 left-20 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="z-10 w-full max-w-md bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 flex flex-col items-center space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
              {isConnected ? 'Hablando con Ana' : 'Asistente Virtual'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isConnected 
                ? 'Escuchando... Puedes preguntar sobre citas, seguros u horarios.' 
                : 'Pulsa el botón para iniciar una llamada con nuestra clínica.'}
            </p>
          </div>

          {/* Visualizer */}
          <div className="py-4">
            <Visualizer 
              inputVolume={volume.input} 
              outputVolume={volume.output} 
              isActive={isConnected}
            />
          </div>

          {/* Error Message */}
          {error && (
             <div className="w-full bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
               {error}
             </div>
          )}

          {/* Controls */}
          <div className="flex flex-col w-full space-y-4">
            {!isConnected && !isConnecting && (
              <button
                onClick={connect}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-lg shadow-teal-600/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Llamar a la Clínica</span>
              </button>
            )}

            {isConnecting && (
              <button
                disabled
                className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-semibold flex items-center justify-center space-x-2 cursor-not-allowed"
              >
                 <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Conectando...</span>
              </button>
            )}

            {isConnected && (
              <button
                onClick={disconnect}
                className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21l-1.498-4.493A1 1 0 0012.38 3H5z" />
                </svg>
                <span>Colgar</span>
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-sm">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-700 mb-1 flex items-center">
               <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Horario
             </h3>
             <p className="text-slate-500">Lun-Vie: 9:00 - 20:00</p>
             <p className="text-slate-500">Sáb: 10:00 - 14:00</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-700 mb-1 flex items-center">
               <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
               Seguros
             </h3>
             <p className="text-slate-500">Santalucía, Mapfre, Asisa y más.</p>
           </div>
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-semibold text-slate-700 mb-1 flex items-center">
               <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               Servicios
             </h3>
             <p className="text-slate-500">General, Cirugía, Vacunas, Urgencias.</p>
           </div>
        </div>
      </main>

      <footer className="bg-white py-4 border-t border-slate-100">
         <div className="text-center text-slate-400 text-xs">
           <p>© 2024 Clínica MascoVet Madrid. Demo de Gemini Live API.</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
