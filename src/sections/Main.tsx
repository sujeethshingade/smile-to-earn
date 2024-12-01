"use client";

import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';
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

declare global {
    interface Window {
        ethereum: any;
    }
}

const SmileCredit = () => {
    const { theme } = useTheme() || {};
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [displayText, setDisplayText] = useState('Say Cheese!');
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
            const img = document.createElement('img');
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
                setSmileResult('Smiling 😀');
                await rewardUser();
            } else {
                setSmileResult('Not Smiling 😐');
            }
        } catch (err: any) {
            console.error("Error:", err);
            setError("Failed to process. Please try again.");
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
            setError("Insufficient funds. Please wait till more donations are made.");
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

    useEffect(() => {
        if (smileResult) {
            setDisplayText(smileResult);
        }
    }, [smileResult]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className={`min-h-screen py-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex flex-col items-center justify-center relative`}>
            <div className="absolute top-4 right-4 hidden md:block">
                <ThemeToggle />
            </div>

            <div className="container flex flex-col items-center justify-center">
                <div className="flex items-center mb-8">
                    <Image
                        src={Logo}
                        alt="Smile Logo"
                        width={50}
                        height={50}
                        className="mr-2"
                        priority
                    />
                    <h1 className={`text-3xl tracking-tight font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        <Link href="/">Smile to Earn</Link>
                    </h1>
                </div>
                <div className="container mx-auto px-4">
                    <div className={`max-w-3xl mx-auto ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>

                        {!account ? (
                            <div className="text-center flex flex-col items-center">
                                <p className="mb-6 max-w-xs text-xl tracking-tight">Connect your wallet to collect reward for your smile!</p>
                                <button
                                    onClick={connectWallet}
                                    disabled={isConnecting}
                                    className="px-4 py-2 bg-fuchsia-600 text-white rounded-sm hover:bg-fuchsia-800 transition-colors duration-300"
                                >
                                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-xl mb-6 max-w-sm text-center mx-auto">Help fund rewards for smiling users by donating ETH</h3>
                                    <p className="text-center font-bold text-xl mb-4">Current Balance: {contractBalance} ETH</p>
                                    <div className="max-w-xs mx-auto">
                                        <form className={`flex flex-col sm:flex-row items-center`}>
                                            <input
                                                type="number"
                                                value={donationAmount}
                                                onChange={(e) => setDonationAmount(e.target.value)}
                                                placeholder="Amount in ETH"
                                                className={`w-full sm:flex-1 px-4 py-2 rounded-l-sm ${theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white'}`}
                                                min="0"
                                                step="0.01"
                                            />
                                            <button
                                                onClick={handleDonate}
                                                disabled={isDonating || !donationAmount}
                                                className="w-full sm:w-auto px-4 py-2 bg-fuchsia-600 text-white rounded-r-sm hover:bg-fuchsia-800 disabled:opacity-50 transition-colors duration-300"
                                            >
                                                Donate
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                <div className='pb-8'>
                                    <h2 className="pt-12 text-2xl font-bold text-center tracking-tight mb-6">
                                        {displayText}
                                    </h2>

                                    <div className="flex flex-col items-center gap-6">
                                        {!photo && (
                                            <div className="w-full">
                                                <div className={`relative aspect-video rounded-sm overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
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
                                                    className="mt-4 w-full px-4 py-2 tracking-tight bg-fuchsia-600 text-white rounded-sm hover:bg-fuchsia-800 transition-colors duration-300 font-medium"
                                                >
                                                    Capture Photo
                                                </button>
                                            </div>
                                        )}

                                        {photo && (
                                            <div className="w-full tracking-tight">
                                                <div className={`relative aspect-video rounded-sm overflow-hidden ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                                                    <img
                                                        src={photo}
                                                        alt="Captured Smile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>

                                                <div className="flex gap-4 mt-4">
                                                    <button
                                                        onClick={() => {
                                                            setPhoto(null);
                                                            setError(null);
                                                            setSmileResult('');
                                                            setDisplayText('Say Cheese!');
                                                            startCamera();
                                                        }}
                                                        className="flex-1 px-4 py-2 bg-slate-500 text-white rounded-sm hover:bg-slate-600 transition-colors duration-300 font-medium"
                                                        disabled={isLoading}
                                                    >
                                                        Retake
                                                    </button>
                                                    <button
                                                        onClick={handleCheckSmile}
                                                        disabled={isLoading || !modelsLoaded}
                                                        className={`flex-1 px-4 py-2 rounded-sm font-medium transition-colors duration-300 ${isLoading || !modelsLoaded ? 'bg-fuchsia-600 cursor-not-allowed' : 'bg-fuchsia-600 hover:bg-fuchsia-800'} text-white`}>
                                                        {isLoading ? 'Processing...' : 'Submit'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-500 text-center px-4 py-2 rounded-sm">
                                        {error}
                                    </div>
                                )}

                            </>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>
            </div>
        </div>
    );
};

function Main() {
    return (
        <ThirdwebProvider>
            <SmileCredit />
        </ThirdwebProvider>
    );
}

export default Main;