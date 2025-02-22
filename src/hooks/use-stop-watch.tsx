import { useCallback, useEffect, useRef, useState } from "react";

interface UseStopWatchResult {
    timeElapsed: number;
    isRunning: boolean;
    startStopWatch: () => void;
    stopStopWatch: () => void;
}

export function useStopWatch() {
    const [timeElapsed, setTimeElapsed] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const rafRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const updateTime = useCallback(() => {
        if(startTimeRef.current !== null) {
            const elapsedMS = Date.now() - startTimeRef.current;
            setTimeElapsed(Math.floor(elapsedMS / 1000));
        }
        setTimeElapsed((prev) => prev + 1);
        rafRef.current = requestAnimationFrame(updateTime);
    },[])

    const startStopWatch = useCallback(() => {
        if (typeof window === "undefined") return;
        if(!isRunning) {
            setIsRunning(true);
            rafRef.current = requestAnimationFrame(updateTime);
            startTimeRef.current = Date.now();
        }
    }, [isRunning, updateTime])

    const stopStopWatch = useCallback(() => {
        if(rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            setIsRunning(false);
        }
    }, []);

    useEffect(() => {
        return () => {
            if(rafRef.current !== null){
                cancelAnimationFrame(rafRef.current);
            }
        }
    },[])

    return {timeElapsed, isRunning,startStopWatch, stopStopWatch}
}