'use client';

import dynamic from 'next/dynamic';

const GameBoard = dynamic(() => import('@/components/GameBoard'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Loading game...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="flex flex-col items-center w-full min-h-screen py-4 md:py-8 px-2">
      <GameBoard />
    </main>
  );
}
