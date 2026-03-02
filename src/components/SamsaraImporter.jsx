import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function SamsaraImporter() {
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const parseData = (text) => {
    const lines = text.trim().split('\n');
    const rows = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split('\t');
      if (parts.length >= 3) {
        const bus_number = parts[0]?.trim();
        const dash_cam_sid = parts[2]?.trim() || null;
        const gateway_sid = parts[3]?.trim() || null;

        if (bus_number) {
          rows.push({ bus_number, dash_cam_sid, gateway_sid });
        }
      }
    }

    return rows;
  };

  const handleImport = async () => {
    if (!textInput.trim()) {
      setError('Please paste data first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const rows = parseData(textInput);

      if (rows.length === 0) {
        setError('No valid data found. Make sure format is correct.');
        setIsProcessing(false);
        return;
      }

      const response = await base44.functions.invoke('importSamsaraData', { rows });
      setResult(response.data);
      setTextInput('');
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid hsl(220,18%,75%)', borderRadius: '2px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', color: 'hsl(220,20%,25%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Upload style={{ width: 14, height: 14 }} /> SAMSARA CAMERA & GATEWAY ID IMPORT
      </div>

      <textarea
        placeholder="Paste the spreadsheet data here (Tab-separated format with headers)"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        style={{
          width: '100%',
          minHeight: '140px',
          padding: '8px',
          fontSize: '11px',
          fontFamily: "'Courier Prime', monospace",
          border: '1px solid hsl(220,18%,70%)',
          borderRadius: '2px',
          background: 'hsl(220,10%,99%)',
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical'
        }}
      />

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '2px', padding: '8px 10px', fontSize: '11px', color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: '2px' }} />
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '2px', padding: '8px 10px', fontSize: '11px', color: '#166534', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
          <CheckCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Import Complete!</strong> Updated {result.updated} buses, skipped {result.skipped}/{result.total}
            {result.errors && result.errors.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '10px', opacity: 0.9 }}>
                Errors: {result.errors.join('; ')}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={isProcessing || !textInput.trim()}
        style={{
          padding: '7px 14px',
          background: isProcessing ? 'hsl(220,18%,75%)' : 'hsl(140,55%,38%)',
          color: 'white',
          border: 'none',
          borderRadius: '2px',
          fontSize: '11px',
          fontFamily: "'Courier Prime', monospace",
          fontWeight: '700',
          cursor: isProcessing ? 'default' : 'pointer',
          opacity: isProcessing ? 0.6 : 1
        }}
      >
        {isProcessing ? 'IMPORTING...' : 'IMPORT DATA'}
      </button>
    </div>
  );
}