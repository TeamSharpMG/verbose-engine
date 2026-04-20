import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download } from 'lucide-react';

const TextToSpeechPro: React.FC = () => {
  const [text, setText] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>("/default.mp3");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Fix 1: Properly type the refs
  // For DOM elements, use HTMLDivElement. For class instances, use the Class name.
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);

  const base64ToBlob = (base64: any, mime: any) => {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);

    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  };


  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#bbf7d0',
        progressColor: '#22c55e',
        cursorColor: '#16a34a',
        barWidth: 2,
        barRadius: 3,
        height: 80,
      });

      wavesurfer.current.on('finish', () => setIsPlaying(false));

      return () => {
        wavesurfer.current?.destroy();
      };
    }
  }, [audioUrl]);


  useEffect(() => {
    if (audioUrl && wavesurfer.current) {
      wavesurfer.current.load(audioUrl);
      // Clean up memory when the URL changes or component unmounts
      return () => {
        if (audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
      };
    }
  }, [audioUrl]);


  const handleSpeak = async () => {
    if (!text.trim()) {
      setAudioUrl("/default.mp3"); // This hides the Download button
      if (wavesurfer.current) {
        wavesurfer.current.playPause(); // empty(); // This clears the waveform visual
      }
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8000/model/mms/?text=' + text, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }
      );
      const result = await response.json();
      const audioBlob = base64ToBlob(result.output, 'audio/wav');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

    } catch (error) {
      console.error("TTS Failed, falling back to default file", error);
      setAudioUrl("/default.mp3");
    }
  };

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-green-100/50 border border-green-50 p-8">

        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">EchoTTS</h1>
        </div>

        <textarea
          className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-400 outline-none transition-all resize-none text-gray-700"
          placeholder="Enter your text here..."
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
        />

        <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={handleSpeak}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-200"
          >
            Generate Speech
          </button>

          <div className="flex gap-2">
            {audioUrl && (
              <>
                <button
                  onClick={togglePlay}
                  className="p-3 bg-white border border-gray-200 rounded-full hover:bg-green-50 text-green-600 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <a
                  href={audioUrl || "/default.mp3"}
                  download="speech.mp3"
                  className="flex items-center gap-2 px-5 py-3 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-colors"
                >
                  <Download size={18} />
                  <span>Download</span>
                </a>
              </>
            )}
          </div>
        </div>

        <div className={`mt-8 p-4 bg-green-50/30 rounded-xl border border-dashed border-green-200 ${!audioUrl && 'opacity-30'}`}>
          <div ref={waveformRef} />
          {!audioUrl && (
            <p className="text-center text-sm text-green-600/60 font-medium py-4">
              Waveform will appear after generation
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default TextToSpeechPro;
