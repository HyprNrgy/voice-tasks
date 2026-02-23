import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { processAudioTask } from '../services/gemini';
import { Task } from '../types';

export function TaskRecorder({ onTaskCreated }: { onTaskCreated: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'reminders'>) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            const taskData = await processAudioTask(base64data, blob.type);
            if (taskData && taskData.heading) {
              onTaskCreated(taskData);
            } else {
              alert("Could not extract task details from the audio. Please try again.");
            }
          } catch (error) {
            console.error("Error processing audio:", error);
            alert("An error occurred while processing the audio.");
          } finally {
            setIsProcessing(false);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record tasks.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
            : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg hover:shadow-xl hover:-translate-y-1'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isProcessing ? (
          <Loader2 className="w-10 h-10 animate-spin" />
        ) : isRecording ? (
          <>
            <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></span>
            <Square className="w-10 h-10 fill-current" />
          </>
        ) : (
          <Mic className="w-10 h-10" />
        )}
      </button>
      <p className="mt-6 text-sm font-medium text-zinc-500 uppercase tracking-widest">
        {isProcessing ? 'Processing Audio...' : isRecording ? 'Recording... Tap to Stop' : 'Tap to Record Task'}
      </p>
    </div>
  );
}
