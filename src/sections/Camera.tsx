"use client";

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/Theme';
import * as faceapi from '@vladmandic/face-api';
import { getContract, createThirdwebClient, defineChain } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";
import { Web3Provider } from '@ethersproject/providers';
import { ethers } from "ethers";

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const contract = getContract({
    client,
    chain: defineChain(11155111),
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
});

const CONTRACT_ABI = [
    "function creditUser(address user) external",
    "function donate() external payable"
];

const Trx = () => {
    const { theme } = useTheme() || {};
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [smileResult, setSmileResult] = useState<string>('');
    const [isDonating, setIsDonating] = useState(false);
    const [donationAmount, setDonationAmount] = useState('');
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [provider, setProvider] = useState<Web3Provider | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contractBalance, setContractBalance] = useState<string>("0");

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

    const handleCheckSmile = async () => {
        if (!photo || !account || !signer) {
            setError("Please connect your wallet first");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const img = new Image();
            img.src = photo;
            await new Promise((resolve) => img.onload = resolve);

            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (!detection) {
                throw new Error("No face detected");
            }

            if (detection.expressions.happy > 0.8) {
                setSmileResult('Smiling! Processing reward...');
                await rewardUser();
            } else {
                setSmileResult('Not quite smiling - try again! 😐');
            }
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.message || "Failed to process. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const rewardUser = async () => {
        if (!signer || !account) {
            setError("No wallet connected");
            return;
        }
    
        try {
            const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
    
            const tx = await contract.creditUser(account);
            await tx.wait();
    
            setSmileResult('Smiling - Reward Sent! 🎉');
        } catch (err: any) {
            console.error("Reward error:", err);
            setError(err.message || "Failed to send reward. Please try again.");
        }
    };

    const handleDonate = async () => {
        if (!signer || !donationAmount) return;

        setIsDonating(true);
        try {
            const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.donate({
                value: ethers.parseEther(donationAmount)
            });
            await tx.wait();

            alert("Thank you for your donation!");
            setDonationAmount('');
            getContractBalance();
        } catch (err) {
            console.error("Donation error:", err);
            setError("Failed to donate. Please try again.");
        } finally {
            setIsDonating(false);
        }
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new Web3Provider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                const signer = provider.getSigner();
                const address = await signer.getAddress();

                setProvider(provider);
                setSigner(signer as unknown as ethers.Signer);
                setAccount(address);
            } catch (error) {
                console.error('User rejected the request');
                setError("Failed to connect wallet");
            }
        } else {
            alert('MetaMask is not installed');
        }
    };

    const getContractBalance = async () => {
        if (!provider) return;
        try {
            const balance = await provider.getBalance(contract.address);
            setContractBalance(ethers.formatEther(balance.toString()));
        } catch (err) {
            console.error("Error fetching balance:", err);
        }
    };

    useEffect(() => {
        if (account) {
            loadModels();
            startCamera();
        }
        return () => stopCamera();
    }, [account]);

    useEffect(() => {
        if (provider) {
            getContractBalance();
        }
    }, [provider]);

    return (
        <div className={`min-h-screen py-8 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
            <div className="container mx-auto px-4">
                <div className={`max-w-3xl mx-auto p-6 rounded-md border ${theme === 'dark' ? 'bg-black text-white border-white' : 'bg-white text-black border-black'
                    }`}>
                    <h2 className="text-2xl font-bold text-center tracking-tight mb-6">
                        Say Cheese!
                    </h2>

                    {!account ? (
                        <div className="text-center">
                            <p className="mb-4">Connect your wallet to start earning rewards for your smile!</p>
                            <button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="px-6 py-3 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors duration-300"
                            >
                                {isConnecting ? "Connecting..." : "Connect Wallet"}
                            </button>
                        </div>
                    ) : (
                        <>
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
                                                className={`flex-1 px-6 py-3 rounded-md font-medium transition-colors duration-300 ${isLoading || !modelsLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'} text-white`}>
                                                {isLoading ? 'Processing...' : 'Check Smile'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t">
                                <h3 className="text-xl font-semibold mb-4 text-center">Support the Project</h3>

                                <div className="mb-6 text-center">
                                    <p className="text-lg mb-2">Current Balance</p>
                                    <p className="text-2xl font-bold">{contractBalance} ETH</p>
                                </div>

                                <div className="max-w-md mx-auto">
                                    <div className="flex flex-col sm:flex-row items-center gap-4">
                                        <input
                                            type="number"
                                            value={donationAmount}
                                            onChange={(e) => setDonationAmount(e.target.value)}
                                            placeholder="Amount in ETH"
                                            className="w-full sm:flex-1 px-4 py-2 border rounded-md text-black"
                                            min="0"
                                            step="0.01"
                                        />
                                        <button
                                            onClick={handleDonate}
                                            disabled={isDonating || !donationAmount}
                                            className="w-full sm:w-auto px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors duration-300"
                                        >
                                            {isDonating ? 'Donating...' : 'Donate'}
                                        </button>
                                    </div>

                                    <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                                        Help fund rewards for smiling users by donating ETH
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </div>
    );
};

function Camera() {
    return (
        <ThirdwebProvider>
            <Trx />
        </ThirdwebProvider>
    );
}

export default Camera;