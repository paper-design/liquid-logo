'use client';

import { useStopWatch } from '@/hooks/use-stop-watch';
import { useState, useRef, useEffect, type JSX } from 'react';
import { toast } from 'sonner';

type RecordingControls = {
    stop: () => void;
};

function record(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    onStop: () => void
): RecordingControls | null {
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
            videoBitsPerSecond: 10_000_000
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
                console.log('Received chunk:', event.data.size);
            }
        };

        mediaRecorder.onstop = () => {
            if (chunks.length > 0) {
                console.log('Starting export with', chunks.length, 'chunks');
                
                const blob = new Blob(chunks, { type: 'video/webm' });
                console.log('Blob created:', blob.size);
                
                const url = URL.createObjectURL(blob);
                console.log('Object URL created:', url);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `recording-${Date.now()}.webm`;
                
                document.body.appendChild(a);
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                
                a.dispatchEvent(clickEvent);
                document.body.removeChild(a);
                
                URL.revokeObjectURL(url);
                chunks.length = 0;
                
                console.log('Export completed');
            } else {
                console.log('No chunks available for export');
                toast.error('No video data recorded');
            }

            onStop();
        };

        mediaRecorder.start(1000);
        return { stop: () => mediaRecorder.stop() };
    } catch (error) {
        toast.error(`Recording failed: ${error}`);
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
    const [exporting, setExporting] = useState(false);
    const recordingRef = useRef<RecordingControls | null>(null);

    const toggleRecording = () => {
        console.log('Toggle recording called');
        console.log('Canvas ref:', canvasRef.current);
        
        if (!canvasRef.current) {
            console.log('Error: No canvas element found');
            toast.error('No canvas element found');
            return;
        }
        
        if (isRecording) {
            console.log('Stopping recording...');
            stopStopWatch();
            recordingRef.current?.stop();
            setIsRecording(false);
            setExporting(true);
        } else {
            console.log('Starting recording...');
            startStopWatch();
            recordingRef.current = record(canvasRef, () => setExporting(false));
            setIsRecording(true);
            setExporting(false);
        }
    };

    useEffect(() => {
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stop();
            }
        };
    }, []);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-20 overflow-hidden ${className || ''}`}>
            {exporting && (
                <div className="text-white text-sm mb-2">
                    Exporting video...
                </div>
            )}
            
            <div className={`text-2xl font-mono font-bold text-white w-40 ${isRecording ? 'visible' : 'invisible'}`}>
                {formatTime(timeElapsed)}
            </div>
            
            <RecordButton 
                isRecording={isRecording}
                exporting={exporting}
                toggleRecording={toggleRecording}
            />
        </div>
    );
}

function RecordButton({ 
    isRecording, 
    exporting, 
    toggleRecording 
}: { 
    isRecording: boolean;
    exporting: boolean;
    toggleRecording: () => void; 
}): JSX.Element {
    return (
        <button
            className={`relative flex h-35 w-35 items-center justify-center rounded-full bg-white transition-all duration-300 ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : ''
            }`}
            onClick={toggleRecording}
            aria-label={exporting ? 'Exporting...' : isRecording ? 'Stop recording' : 'Start recording'}
            disabled={exporting}
        >
            <div className={`flex h-[calc(100%-4px)] w-[calc(100%-4px)] items-center justify-center rounded-full bg-button transition-all duration-300 ${
                isRecording ? 'scale-[0.6]' : ''
            }`}>
                {exporting && (
                    <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
                )}
            </div>
            
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