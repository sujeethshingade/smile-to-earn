"use client";

import dynamic from 'next/dynamic';
import { Header } from "@/sections/Header";

const DynamicCamera = dynamic(() => import('@/sections/Camera').then(mod => mod.default), { ssr: false });

export default function Home() {
  return (
    <>
      <Header />
      <DynamicCamera />
    </>
  );
}
