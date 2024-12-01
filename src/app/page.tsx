"use client";

import dynamic from 'next/dynamic';

const DynamicMain = dynamic(() => import('@/sections/Main').then(mod => mod.default), { ssr: false });

export default function Home() {
  return (
    <>
      <DynamicMain />
    </>
  );
}
