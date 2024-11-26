"use client";

import dynamic from 'next/dynamic';
import { Header } from "@/sections/Header";
import { Footer } from "@/sections/Footer";

const DynamicCamera = dynamic(() => import('@/sections/Camera').then(mod => mod.default), { ssr: false });

export default function Home() {
  return (
    <>
      <Header />
      <DynamicCamera />
      <Footer />
    </>
  );
}
