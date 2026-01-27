export default function StatCard({ label, value, icon, subLabel }) {
    return (
        <div className="glass-panel" style={{
            padding: '15px',
            textAlign: 'center',
            minWidth: '100px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '5px' }}>
                {label}
            </div>
            {subLabel && (
                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>
                    {subLabel}
                </div>
            )}
        </div>
    );
}
