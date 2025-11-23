import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, AudioVolume } from '../types';
import { base64ToUint8Array, decodeAudioData, float32To16BitPCM, uint8ArrayToBase64 } from '../utils/audioUtils';

const API_KEY = process.env.API_KEY || '';
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

interface UseGeminiLiveReturn {
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  volume: AudioVolume;
  error: string | null;
}

export const useGeminiLive = (): UseGeminiLiveReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<AudioVolume>({ input: 0, output: 0 });

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store the session object
  const mountedRef = useRef<boolean>(true);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('Cleaning up session...');
    
    // Stop input stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Disconnect audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Close contexts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    // Stop all playing sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current.clear();

    // Close session
    if (sessionRef.current) {
      // Try to close if method exists, otherwise just nullify
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume({ input: 0, output: 0 });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const connect = useCallback(async () => {
    if (!API_KEY) {
      setError('API Key not found in environment variables.');
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: API_KEY });

      // System Instruction
      const systemInstruction = `Eres Ana, la recepcionista virtual de "Clínica MascoVet" en Madrid, España.
      Tu voz debe ser profesional, cálida, atenta y con acento de España.
      
      Tus funciones son:
      1. Programar citas para mascotas (perros, gatos, exóticos).
      2. Responder preguntas sobre horarios: Lunes a Viernes 09:00 - 20:00, Sábados 10:00 - 14:00.
      3. Confirmar que aceptamos la mayoría de seguros de mascotas (como Santalucía, Mapfre, etc.).
      4. Explicar servicios: Consulta general, vacunación, cirugía, urgencias 24h (solo teléfono).
      
      IMPORTANTE:
      - Al iniciar, SALUDA INMEDIATAMENTE con: "Clínica MascoVet. Hola, soy Ana, tu asistente virtual. ¿Cómo te puedo ayudar hoy?"
      - Sé concisa pero amable.
      - Si te piden algo fuera de tu alcance, ofrece tomar nota para que un humano llame luego.
      - Habla siempre en español de España.`;

      const config = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Kore is usually a female voice option
        },
        systemInstruction: systemInstruction,
      };

      // Connect to Gemini Live
      // We use a promise wrapper to handle the session resolution for sending data
      let sessionResolve: (value: any) => void;
      const sessionPromise = new Promise<any>((resolve) => {
        sessionResolve = resolve;
      });

      const session = await ai.live.connect({
        model: MODEL_NAME,
        config: config,
        callbacks: {
          onopen: async () => {
            console.log('Gemini Live Session Opened');
            if (mountedRef.current) {
              setConnectionState(ConnectionState.CONNECTED);
            }
            
            // Setup Input Audio Processing
            if (!inputAudioContextRef.current || !streamRef.current) return;

            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            
            // Use ScriptProcessor for capturing raw PCM (as per guideline example)
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate input volume for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(prev => ({ ...prev, input: Math.min(rms * 5, 1) })); // Amplify a bit for visual

              // Convert to 16-bit PCM
              const pcm16 = float32To16BitPCM(inputData);
              const pcmUint8 = new Uint8Array(pcm16);
              const base64Data = uint8ArrayToBase64(pcmUint8);

              sessionPromise.then(s => {
                s.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64Data
                  }
                });
              });
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);

            // Send initial trigger to force the greeting if needed
            // The system instruction says "Greeting immediately", but sometimes the model waits for input.
            // We can try to send a text trigger or just let the connection happen.
            // Some versions of the live API support sending text to kickstart.
            sessionPromise.then(s => {
                // Sending a dummy "user joined" text can trigger the welcome message
                // Note: The provided documentation emphasizes sendRealtimeInput for media. 
                // However, usually we can also send text. We will rely on system instruction first.
                // If supported: s.send({ parts: [{ text: "Hola" }] });
                // We'll stick to the system instruction behaving as a "welcome" message.
                 setTimeout(() => {
                   // A small trick: send a tiny silent audio frame or a text message if possible.
                   // Here we rely on the prompt request "Tan pronto como se habilite".
                   // We will attempt to send a text signal.
                   try {
                     s.send({ parts: [{ text: "The user has connected. Please say the greeting defined in system instructions." }] });
                   } catch (e) {
                     console.warn("Could not send text trigger", e);
                   }
                 }, 500);
            });
          },
          onmessage: async (msg: LiveServerMessage) => {
            const { serverContent } = msg;

            // Handle Audio Output
            const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              const ctx = audioContextRef.current;
              try {
                const uint8 = base64ToUint8Array(audioData);
                const audioBuffer = await decodeAudioData(uint8, ctx, 24000, 1);
                
                // Calculate output volume for UI (approximated from buffer)
                const chanData = audioBuffer.getChannelData(0);
                let sum = 0;
                // Sample a few points for efficiency
                for (let i = 0; i < chanData.length; i += 100) {
                   sum += chanData[i] * chanData[i];
                }
                const rms = Math.sqrt(sum / (chanData.length / 100));
                setVolume(prev => ({ ...prev, output: Math.min(rms * 5, 1) }));

                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                
                const outputNode = ctx.createGain();
                outputNode.gain.value = 1.0;
                
                source.connect(outputNode);
                outputNode.connect(ctx.destination);

                // Schedule playback
                const currentTime = ctx.currentTime;
                if (nextStartTimeRef.current < currentTime) {
                  nextStartTimeRef.current = currentTime;
                }
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                
                audioSourcesRef.current.add(source);
                source.onended = () => {
                   audioSourcesRef.current.delete(source);
                   // Reset volume when silent (approx)
                   if (audioSourcesRef.current.size === 0) {
                     setVolume(prev => ({ ...prev, output: 0 }));
                   }
                };

              } catch (e) {
                console.error("Audio decode error", e);
              }
            }

            // Handle Interruptions
            if (serverContent?.interrupted) {
              console.log("Model interrupted");
              audioSourcesRef.current.forEach(s => s.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
            
            // Handle Turn Complete (Optional logging)
            if (serverContent?.turnComplete) {
              // console.log("Turn complete");
            }
          },
          onclose: () => {
            console.log("Session closed");
            cleanup();
          },
          onerror: (e) => {
            console.error("Session error", e);
            setError("Connection error occurred.");
            cleanup();
          }
        }
      });

      sessionRef.current = session;
      sessionResolve!(session);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to Gemini Live.");
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [cleanup]);

  return {
    connectionState,
    connect,
    disconnect: cleanup,
    volume,
    error
  };
};
