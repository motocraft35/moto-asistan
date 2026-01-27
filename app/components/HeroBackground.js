'use client';

import { useState, useEffect } from 'react';

export default function HeroBackground() {
    return (
        <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            overflow: 'hidden',
            zIndex: 0,
            backgroundColor: '#050510'
        }}>
            {/* Video Layer */}
            <video
                autoPlay
                loop
                muted
                playsInline
                webkit-playsinline="true"
                poster="/bg.png"
                style={{
                    width: '100%',
                    height: '100dvh',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0, left: 0,
                    zIndex: 1,
                    pointerEvents: 'none',
                    willChange: 'transform' // GPU Acceleration hint
                }}
            >
                <source src="/login-bg.mp4" type="video/mp4" />
            </video>

            {/* Static Fallback Layer (No more carousel to save CPU) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'url(/bg.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                }}
            />

            {/* Overlay Layer (Gradient) */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))',
                zIndex: 2,
                mixBlendMode: 'multiply' // Adds that filter effect
            }}></div>

            {/* Color Filter Overlay for "Vibrant" look */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(45deg, rgba(255, 0, 0, 0.2), rgba(0, 0, 255, 0.2))',
                zIndex: 3,
                pointerEvents: 'none'
            }}></div>
        </div>
    );
}
