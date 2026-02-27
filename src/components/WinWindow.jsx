export default function WinWindow({ title, children }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      marginBottom: '16px'
    }}>
      <div style={{
        width: '100%',
        backgroundColor: '#1a3a6b',
        color: 'white',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'block',
        boxSizing: 'border-box'
      }}>
        {title}
      </div>
      <div style={{
        width: '100%',
        display: 'block',
        boxSizing: 'border-box'
      }}>
        {children}
      </div>
    </div>
  );
}