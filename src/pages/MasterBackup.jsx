import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LoadingScreen from '../components/LoadingScreen';
import { Download, FileText, Database, AlertCircle } from 'lucide-react';

export default function MasterBackup() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const { data: buses = [] } = useQuery({ queryKey: ['buses'], queryFn: () => base44.entities.Bus.list() });
  const { data: workOrders = [] } = useQuery({ queryKey: ['workOrders'], queryFn: () => base44.entities.WorkOrder.list() });
  const { data: inspections = [] } = useQuery({ queryKey: ['inspections'], queryFn: () => base44.entities.Inspection.list() });
  const { data: serializedAssets = [] } = useQuery({ queryKey: ['serializedAssets'], queryFn: () => base44.entities.SerializedAsset.list() });
  const { data: nonSerializedAssets = [] } = useQuery({ queryKey: ['nonSerializedAssets'], queryFn: () => base44.entities.NonSerializedAsset.list() });
  const { data: hdrives = [] } = useQuery({ queryKey: ['hdrives'], queryFn: () => base44.entities.HDrive.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const isLoading = !buses.length || !workOrders.length;

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportFormat('PDF');
    try {
      const response = await base44.functions.invoke('exportMasterPDF');
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master-backup-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error exporting PDF: ' + error.message);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportXLSX = async () => {
    setIsExporting(true);
    setExportFormat('XLSX');
    try {
      const response = await base44.functions.invoke('exportMasterDataZip');
      const blob = new Blob([response.data], { type: 'application/x-tar' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `master-backup-${new Date().toISOString().split('T')[0]}.tar`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Error exporting spreadsheet: ' + error.message);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: "'Courier Prime', monospace" }}>
      <LoadingScreen isLoading={isLoading} message="LOADING FLEET DATA..." />

      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, hsl(220,50%,30%), hsl(220,45%,40%))', color: 'white', padding: '12px 14px', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database style={{ width: 20, height: 20 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '0.08em' }}>MASTER BACKUP & ARCHIVE</div>
            <div style={{ fontSize: '10px', opacity: 0.8, letterSpacing: '0.05em' }}>COMPREHENSIVE SYSTEM DATA EXPORT</div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <AlertCircle style={{ width: 16, height: 16, color: 'hsl(220,30%,45%)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '11px', color: 'hsl(220,20%,30%)', lineHeight: '1.5' }}>
          This export includes all system data: Fleet vehicles, work orders, inspections, assets, H-drives, users, and service history. Choose PDF for a human-readable report or Excel for data in multi-sheet spreadsheet format.
        </div>
      </div>

      {/* Data Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
        {[
          { label: 'VEHICLES', count: buses.length, color: 'hsl(220,65%,45%)' },
          { label: 'WORK ORDERS', count: workOrders.length, color: 'hsl(140,55%,40%)' },
          { label: 'INSPECTIONS', count: inspections.length, color: 'hsl(30,85%,45%)' },
          { label: 'SERIALIZED ASSETS', count: serializedAssets.length, color: 'hsl(200,75%,42%)' },
          { label: 'SPARE PARTS', count: nonSerializedAssets.length, color: 'hsl(280,65%,42%)' },
          { label: 'H-DRIVES', count: hdrives.length, color: 'hsl(0,65%,50%)' },
          { label: 'USERS', count: users.length, color: 'hsl(150,60%,42%)' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: 'white',
              border: `2px solid ${item.color}`,
              borderRadius: '2px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '18px', fontWeight: '700', color: item.color, lineHeight: 1 }}>{item.count}</div>
            <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', marginTop: '4px', letterSpacing: '0.06em', textAlign: 'center' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div style={{ background: 'hsl(220,18%,96%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(220,20%,30%)', letterSpacing: '0.06em', marginBottom: '10px' }}>EXPORT FORMAT</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
          {/* PDF Export */}
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'white',
              border: '2px solid hsl(220,65%,45%)',
              borderRadius: '2px',
              fontSize: '12px',
              fontFamily: "'Courier Prime', monospace",
              fontWeight: '600',
              color: 'hsl(220,65%,35%)',
              cursor: isExporting && exportFormat === 'PDF' ? 'default' : 'pointer',
              opacity: isExporting && exportFormat === 'PDF' ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isExporting)
                e.currentTarget.style.background = 'hsl(220,65%,95%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <FileText style={{ width: 16, height: 16 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>PDF</div>
              <div style={{ fontSize: '9px', opacity: 0.8 }}>{isExporting && exportFormat === 'PDF' ? 'Exporting...' : 'Multi-page report'}</div>
            </div>
          </button>

          {/* Excel Spreadsheet Export */}
          <button
            onClick={handleExportXLSX}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'white',
              border: '2px solid hsl(45,90%,50%)',
              borderRadius: '2px',
              fontSize: '12px',
              fontFamily: "'Courier Prime', monospace",
              fontWeight: '600',
              color: 'hsl(45,90%,35%)',
              cursor: isExporting && exportFormat === 'XLSX' ? 'default' : 'pointer',
              opacity: isExporting && exportFormat === 'XLSX' ? 0.6 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!isExporting)
                e.currentTarget.style.background = 'hsl(45,90%,95%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>EXCEL (TAR)</div>
              <div style={{ fontSize: '9px', opacity: 0.8 }}>{isExporting && exportFormat === 'XLSX' ? 'Exporting...' : '10 CSV files uncompressed'}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{ background: 'hsl(220,10%,95%)', border: '1px solid hsl(220,18%,78%)', borderRadius: '2px', padding: '10px 12px', fontSize: '10px', color: 'hsl(220,10%,45%)', lineHeight: '1.5', letterSpacing: '0.04em' }}>
        <strong>EXPORT CONTENTS:</strong> All fleet vehicles with specifications, complete work order history with repair details, inspection records, serialized and non-serialized assets, H-drive custody logs, system users and roles, and service hour summaries.
      </div>
    </div>
  );
}