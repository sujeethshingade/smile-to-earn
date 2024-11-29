"use client";

import dynamic from 'next/dynamic';
import { Header } from "@/sections/Header";

const DynamicMain = dynamic(() => import('@/sections/Main').then(mod => mod.default), { ssr: false });

export default function Home() {
  return (
    <>
      <Header />
      <DynamicMain />
    </>
  );
}
