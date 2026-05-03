import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, Mic, AudioLinesIcon } from 'lucide-react';
import './TextToSpeechPro.css';

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

    const dotColor = isPlaying ? '#4a8c5c' : audioUrl ? '#a0bca2' : '#c8d8c8';

   return (
    <div className="root">
 
      {/* TOP BAR */}
      <div className="topbar hpad">
        <div className="brand-row">
          <div className="icon-wrap">
            <Mic size={24} color="#e8f5e8" strokeWidth={1.5} />
          </div>
          <span className="brand-name">
            TTS-<span className="brand-accent">MG</span>
          </span>
        </div>
        <div className="status-pill">
          <span className="status-dot" style={{ backgroundColor: dotColor }} />
          <span className="status-label" style={{ color: dotColor }}>
            {isPlaying ? 'Playing' : audioUrl ? 'Ready' : 'Idle'}
          </span>
        </div>
      </div>
 
      {/* INPUT ZONE */}
      <div className="input-zone hpad">
        <div className="input-header">
          <span className="section-label">Input text</span>
          <span className="char-count">{text.length} chars</span>
        </div>
        <textarea
          className="textarea"
          placeholder="Enter your text here..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
 
      {/* CONTROLS BAR */}
      <div className="controls-bar hpad">
        <button className="flex gap-2 items-center btn-gen" onClick={handleSpeak}>
          <AudioLinesIcon/> Generate
        </button>
        {audioUrl && (
          <div className="play-group">
            <button className="btn-play" onClick={togglePlay}>
              {isPlaying
                ? <Pause fill='white' size={16} strokeWidth={1.5} />
                : <Play fill='white' size={16} strokeWidth={1.5} />
              }
            </button>
            <a className="btn-export" href={audioUrl} download="speech.wav">
              <Download size={12} strokeWidth={1.5} />
              Export .wav
            </a>
          </div>
        )}
      </div>
 
      {/* WAVE ZONE */}
      <div className="wave-zone hpad">
        <span className="wave-label">Waveform</span>
        <div className="wave-box" style={{ opacity: audioUrl ? 1 : 0.5 }}>
          <div ref={waveformRef} className="wave-div" />
          {!audioUrl && (
            <span className="wave-empty-text">Generate to see waveform</span>
          )}
        </div>
      </div>
 
      {/* FOOTER */}
      <div className="footer hpad">
        <span className="footer-text">
          tts_mg_v1.0 - TeamSharpMG - 2026
        </span>
      </div>
 
    </div>
  );
};

export default TextToSpeechPro;
