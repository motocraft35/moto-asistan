'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GestureNavigation() {
    const router = useRouter();
    const touchStart = useRef({ x: 0, y: 0, time: 0 });
    const EDGE_THRESHOLD = 40; // Pixels from edge to start gesture
    const MIN_SWIPE_DISTANCE = 50; // Minimum horizontal travel
    const MAX_VERTICAL_DEVIATION = 40; // Maximum allowed vertical travel
    const MAX_SWIPE_TIME = 300; // MS

    useEffect(() => {
        const handleTouchStart = (e) => {
            const touch = e.touches[0];
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        };

        const handleTouchEnd = (e) => {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStart.current.x;
            const deltaY = touch.clientY - touchStart.current.y;
            const deltaTime = Date.now() - touchStart.current.time;

            const isFromLeftEdge = touchStart.current.x < EDGE_THRESHOLD;
            const isFromRightEdge = touchStart.current.x > window.innerWidth - EDGE_THRESHOLD;

            if ((isFromLeftEdge && deltaX > MIN_SWIPE_DISTANCE) ||
                (isFromRightEdge && deltaX < -MIN_SWIPE_DISTANCE)) {

                if (Math.abs(deltaY) < MAX_VERTICAL_DEVIATION && deltaTime < MAX_SWIPE_TIME) {
                    // Valid edge swipe detected
                    router.back();
                }
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [router]);

    return null;
}
