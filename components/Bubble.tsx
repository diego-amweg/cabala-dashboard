'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type BubbleVariant = 'play' | 'data' | 'info';

interface BubbleProps {
  id: string;
  variant: BubbleVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<BubbleVariant, string> = {
  play: 'border-orange-200 bg-orange-50 text-orange-900',
  data: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-stone-200 bg-stone-50 text-stone-700',
};

export default function Bubble({ id, variant, children }: BubbleProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const key = `cabala:bubbleSeen:${id}`;
    try {
      if (!localStorage.getItem(key)) {
        setAnimate(true);
        localStorage.setItem(key, '1');
      }
    } catch {
      // si localStorage no está disponible, simplemente no animamos
    }
  }, [id]);

  return (
    <div className={`mb-2 rounded-md border px-3 py-1.5 text-xs leading-snug ${VARIANT_CLASSES[variant]} ${animate ? 'cabala-bubble-in' : ''}`}>
      {children}
    </div>
  );
}
