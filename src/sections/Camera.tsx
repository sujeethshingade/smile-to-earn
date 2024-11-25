"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/Theme';

export const Camera = () => {
  const { theme } = useTheme() || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
      setStream(mediaStream);
    } catch (err) {
      setError("Failed to access camera. Please ensure camera permissions are granted.");
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const { videoWidth, videoHeight } = videoRef.current;
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        context.scale(-1, 1); // flip horizontally
        context.drawImage(videoRef.current, -videoWidth, 0, videoWidth, videoHeight);
        const photoData = canvasRef.current.toDataURL('image/png');
        setPhoto(photoData);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className={`min-h-screen py-8 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="container mx-auto px-4">
        <div className={`max-w-2xl mx-auto p-6 rounded-xl shadow-lg ${
          theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'
        }`}>
          <h2 className="text-2xl font-bold text-center mb-6">
            Take Your Best Smile!
          </h2>

          {error && (
            <div className="text-red-500 text-center mb-4 p-2 rounded bg-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            {!photo && (
              <div className="w-full">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                </div>
                <button
                  onClick={takePhoto}
                  className="mt-4 w-full px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                >
                  Take Photo
                </button>
              </div>
            )}

            {photo && (
              <div className="w-full">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                  <img 
                    src={photo}
                    alt="Captured smile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => {
                      setPhoto(null);
                      startCamera();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => {
                      // handle photo submission
                      console.log("Submitting photo:", photo);
                    }}
                    className="flex-1 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
}