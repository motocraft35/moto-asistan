'use client';

import { useState, useEffect, useRef } from 'react';

export default function RemoteAdmin() {
    const [history, setHistory] = useState([
        { type: 'sys', text: 'Moto-Asistan Remote Shell [v1.0.0]' },
        { type: 'sys', text: 'Connecting to main cluster...' },
        { type: 'sys', text: 'Authorized. Welcome, Super Admin.' },
        { type: 'sys', text: "Type 'help' to see available commands." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const cmd = input.trim();
        setHistory(prev => [...prev, { type: 'cmd', text: `> ${cmd}` }]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            });
            const data = await res.json();

            if (data.error) {
                setHistory(prev => [...prev, { type: 'err', text: `Error: ${data.error}` }]);
            } else {
                setHistory(prev => [...prev, { type: 'out', text: data.output }]);
            }
        } catch (err) {
            setHistory(prev => [...prev, { type: 'err', text: 'Critical network failure.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            background: '#000',
            minHeight: '100vh',
            padding: '20px',
            color: '#0f0',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '80px' }}>
                {history.map((line, i) => (
                    <div key={i} style={{
                        marginBottom: '10px',
                        color: line.type === 'err' ? '#f00' : line.type === 'cmd' ? '#fff' : line.type === 'out' ? '#0f0' : '#888',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {line.text}
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSubmit} style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                background: '#111',
                borderTop: '1px solid #111',
                display: 'flex',
                gap: '10px'
            }}>
                <span style={{ color: '#0f0', display: 'flex', alignItems: 'center' }}>$</span>
                <input
                    autoFocus
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder={loading ? 'EXECUTING...' : 'Enter command...'}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        color: '#0f0',
                        fontSize: '1.2rem',
                        outline: 'none',
                        fontFamily: 'monospace'
                    }}
                />
            </form>
        </div>
    );
}
