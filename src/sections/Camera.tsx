"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/Theme';
import * as faceapi from '@vladmandic/face-api';

export const Camera = () => {
  const { theme } = useTheme() || {};
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [smileResult, setSmileResult] = useState<string>('');

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.load(MODEL_URL),
        faceapi.nets.faceLandmark68Net.load(MODEL_URL),
        faceapi.nets.faceExpressionNet.load(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error("Error loading models:", err);
      setError("Failed to load face detection models");
    }
  };

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
        context.translate(videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        const photoData = canvasRef.current.toDataURL('image/png');
        setPhoto(photoData);
        stopCamera();
      }
    }
  };

  const detectSmile = async (imageElement: HTMLImageElement): Promise<boolean> => {
    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      if (!detection) {
        throw new Error("No face detected");
      }

      return detection.expressions.happy > 0.8;
    } catch (err) {
      console.error("Error detecting smile:", err);
      throw err;
    }
  };

  const handleCheckSmile = async () => {
    if (!photo) return;

    setIsLoading(true);
    setError(null);
    setSmileResult('');

    try {
      const img = new Image();
      img.src = photo;
      await img.decode();

      const isSmiling = await detectSmile(img);

      if (isSmiling) {
        setSmileResult('Smiling');
      } else {
        setSmileResult('Not Smiling');
      }
    } catch (err) {
      setError("Failed to process image. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className={`min-h-screen py-8 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="container mx-auto px-4">
      <div className={`max-w-3xl mx-auto p-6 rounded-md border ${theme === 'dark' ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
                    }`}>
                    <h2 className="text-2xl font-bold text-center tracking-tight mb-6">
                        Say Cheese!
                    </h2>

          {error && (
            <div className="text-red-500 text-center mb-4 p-2 rounded bg-red-100">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            {!photo && (
              <div className="w-full">
                                <div className={`relative aspect-video rounded-md overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
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
                  className="mt-4 w-full px-6 py-3 tracking-tight bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors duration-300 font-medium"
                >
                  Take Photo
                </button>
              </div>
            )}

            {photo && (
              <div className="w-full tracking-tight">
                <div className={`relative aspect-video rounded-md overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                  <img
                    src={photo}
                    alt="Captured Smile"
                    className="w-full h-full object-cover"
                  />
                </div>
                {smileResult && (
                  <p className="text-center mt-4 text-2xl font-bold">
                    {smileResult}
                  </p>
                )}
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setError(null);
                      setSmileResult('');
                      startCamera();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-300 font-medium"
                    disabled={isLoading}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleCheckSmile}
                    disabled={isLoading || !modelsLoaded}
                    className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors duration-300
                      ${isLoading || !modelsLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'}
                      text-white`}
                  >
                    {isLoading ? 'Processing...' : 'Check Smile'}
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