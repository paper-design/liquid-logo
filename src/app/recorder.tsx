'use client';

import { useStopWatch } from '@/hooks/use-stop-watch';
import { useState, useRef, type JSX } from 'react';

type RecordingControls = {
  stop: () => void;
};

function record(canvasRef: React.RefObject<HTMLCanvasElement | null>): RecordingControls | null {
  const canvas = canvasRef.current;
  console.log('Attempting to record canvas:', canvas);
  if (!canvas) {
    console.warn('No canvas element found');
    return null;
  }

  try {
    console.log('Capturing stream from canvas');
    const stream = canvas.captureStream(30);
    console.log('Stream obtained:', stream);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2_500_000
    });

    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start(1000);
    console.log('MediaRecorder started successfully');
    return { stop: () => mediaRecorder.stop() };
  } catch (error) {
    console.error('Recording failed:', error);
    return null;
  }
}

interface RecorderProps {
  className?: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

function Recorder({ className, canvasRef }: RecorderProps): JSX.Element {
  const [isRecording, setIsRecording] = useState(false);
  const { timeElapsed, startStopWatch, stopStopWatch } = useStopWatch();
  const recordingRef = useRef<RecordingControls | null>(null);

  const toggleRecording = () => {
    if (!canvasRef.current) return;

    if (isRecording) {
      stopStopWatch();
      recordingRef.current?.stop();
    } else {
      startStopWatch();
      recordingRef.current = record(canvasRef);
    }
    setIsRecording(!isRecording);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-20 overflow-hidden ${className || ''}`}>
      <div className={`text-2xl font-mono font-bold text-white w-40 ${isRecording ? 'visible' : 'invisible'}`}>
        {formatTime(timeElapsed)}
      </div>
      <RecordButton isRecording={isRecording} toggleRecording={toggleRecording} />
    </div>
  );
}

function RecordButton({
  isRecording,
  toggleRecording,
}: {
  isRecording: boolean;
  toggleRecording: () => void;
}): JSX.Element {
  return (
    <button
      className="relative flex h-35 w-35 items-center justify-center rounded-full bg-white transition-all duration-300"
      onClick={toggleRecording}
      aria-label={isRecording ? 'Stop recording' : 'Start recording'}
    >
      <div
        className={`flex h-[calc(100%-4px)] w-[calc(100%-4px)] items-center justify-center rounded-full bg-button transition-all duration-300 ${
          isRecording ? 'scale-[0.6]' : ''
        }`}
      ></div>
      {isRecording && (
        <div className="absolute -top-1 -right-1 h-2 w-2">
          <div className="bg-red-500 animate-ping absolute h-full w-full rounded-full opacity-75"></div>
          <div className="bg-red-500 absolute h-full w-full rounded-full"></div>
        </div>
      )}
    </button>
  );
}

export default Recorder;