import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import WinWindow from '../WinWindow';
import { Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import moment from 'moment';

/**
 * Parse the NHCS audit/repair log format.
 * Entry trigger line: "HH:MM AM/PM M/D/YYYY-TECH.NAME ..."
 * or variations like "HH:MM AM/PM M/D/YYYY- TECH = ..."
 * Multi-line descriptions follow until the next entry or "-" separator.
 */
function parseNHCSLog(rawText) {
  // Regex: time + date + dash + technician info
  // Matches: "10:30 AM 1/24/2024-C.WARNER" or "4:40 PM 8/20/2024- C.WARNER"
  const entryStartRegex = /^(\d{1,2}:\d{2}\s*(?:AM|PM))\s+(\d{1,2}\/\d{1,2}\/\d{4})\s*[-–]\s*([A-Z][A-Z.\s]+?)(?:\s*[=:]\s*|\s+)(.*)$/i;

  const lines = rawText.split('\n');
  const entries = [];
  let current = null;

  const flushCurrent = () => {
    if (current) {
      current.description = current.descLines.join(' ').replace(/\s+/g, ' ').trim();
      delete current.descLines;
      if (current.description) entries.push(current);
      current = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === '-' || line.match(/^\*+$/) || line.match(/^\^+$/)) {
      // separator — don't flush yet, just skip
      continue;
    }

    const match = line.match(entryStartRegex);
    if (match) {
      flushCurrent();
      const [, timeStr, dateStr, tech, restOfLine] = match;
      const datetimeStr = `${dateStr} ${timeStr.replace(/\s+/g, ' ')}`;
      const parsed = moment(datetimeStr, ['M/D/YYYY h:mm A', 'M/D/YYYY hh:mm A'], true);

      current = {
        technician: tech.trim().replace(/\s+/g, ' '),
        start_time: parsed.isValid() ? parsed.toISOString() : datetimeStr,
        _rawDate: dateStr,
        descLines: [restOfLine.trim()].filter(Boolean),
      };
    } else if (current) {
      // continuation line — skip lines that look like header boilerplate
      if (
        line.match(/^NORTH\s+CAROLINA/i) ||
        line.match(/^UNIFORM\s+SCHOOL/i) ||
        line.match(/^CONTROL\s+#/i) ||
        line.match(/^SYSTEM\s+TYPE/i) ||
        line.match(/^#\s+OF\s+CAMERAS/i) ||
        line.match(/^SCHOOL\s+DISTRICT/i) ||
        line.match(/FERPA\s+STATUS/i)
      ) continue;
      current.descLines.push(line);
    }
  }
  flushCurrent();

  return entries;
}

export default function BulkImportHistory({ busNumber, onClose, onSaved }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [step, setStep] = useState('input');
  const queryClient = useQueryClient();

  const bulkCreate = useMutation({
    mutationFn: (entries) =>
      base44.entities.BusHistory.bulkCreate(
        entries.map(e => ({ ...e, bus_number: busNumber }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['busHistory', busNumber] });
      setStep('done');
      onSaved();
    },
  });

  const handleParse = () => {
    const entries = parseNHCSLog(text);
    setParsed(entries);
    setStep('review');
  };

  const handleImport = () => {
    bulkCreate.mutate(parsed);
  };

  const toggleExpand = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <WinWindow title="BULK IMPORT — AUDIT/REPAIR LOG" icon="📂">
      <div className="space-y-2">

        {step === 'input' && (
          <>
            <div className="text-[10px] text-muted-foreground win-panel-inset p-2 leading-relaxed">
              <strong>PASTE RAW NHCS AUDIT/REPAIR LOG TEXT BELOW.</strong><br />
              The system will automatically detect entries in the format:<br />
              <span className="opacity-80 font-mono">HH:MM AM/PM M/D/YYYY-TECH.NAME description...</span><br />
              Multi-line notes following each entry will be captured. Header boilerplate is ignored.
            </div>
            <textarea
              className="win-input w-full text-[11px] font-mono"
              rows={14}
              placeholder={"10:30 AM 1/24/2024-C.WARNER CHECKED BUS AFTER COMPLAINT...\n\tUSED READER TO VIEW AND CHECK STATUS...\n-\n9:31 AM 8/9/2024-C.WARNER COMPLAINT 1,2 and 3 go out..."}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button className="win-button text-[11px]" onClick={onClose}>
                <X className="w-3 h-3 inline mr-1" /> CANCEL
              </button>
              <button
                className="win-button text-[11px] !bg-primary !text-primary-foreground"
                onClick={handleParse}
                disabled={!text.trim()}
              >
                PARSE LOG →
              </button>
            </div>
          </>
        )}

        {step === 'review' && parsed && (
          <>
            <div className="text-[11px] font-bold text-primary mb-1">
              REVIEW: {parsed.length} {parsed.length === 1 ? 'ENTRY' : 'ENTRIES'} DETECTED
            </div>

            {parsed.length === 0 && (
              <div className="win-panel-inset p-3 text-center text-[11px] status-cancelled">
                NO ENTRIES DETECTED. CHECK FORMAT AND TRY AGAIN.
                <div className="mt-1 text-muted-foreground text-[10px]">
                  Entry lines must start with: HH:MM AM/PM M/D/YYYY-TECHNICIAN
                </div>
              </div>
            )}

            {parsed.length > 0 && (
              <div className="win-panel-inset overflow-auto" style={{ maxHeight: '360px' }}>
                {parsed.map((e, i) => (
                  <div
                    key={i}
                    className={`border-b border-border text-[11px] font-mono ${i % 2 === 0 ? 'bg-card' : 'bg-background'}`}
                  >
                    <div
                      className="flex items-start gap-2 p-1.5 cursor-pointer hover:bg-primary/5"
                      onClick={() => toggleExpand(i)}
                    >
                      <span className="text-muted-foreground w-5 text-right shrink-0">{i + 1}.</span>
                      <span className="font-bold text-primary w-28 shrink-0">
                        {e._rawDate || moment(e.start_time).format('M/D/YYYY')}
                      </span>
                      <span className="font-bold w-24 shrink-0 truncate">{e.technician}</span>
                      <span className="text-muted-foreground truncate flex-1">
                        {e.description?.substring(0, 80)}{e.description?.length > 80 ? '...' : ''}
                      </span>
                      {expanded[i]
                        ? <ChevronUp className="w-3 h-3 shrink-0 mt-0.5" />
                        : <ChevronDown className="w-3 h-3 shrink-0 mt-0.5" />
                      }
                    </div>
                    {expanded[i] && (
                      <div className="px-3 pb-2 pt-1 space-y-1 bg-primary/5 border-t border-border">
                        <div className="grid grid-cols-2 gap-x-4 text-[10px]">
                          <div><span className="font-bold">DATE/TIME: </span>{moment(e.start_time).isValid() ? moment(e.start_time).format('MM/DD/YYYY hh:mm A') : e.start_time}</div>
                          <div><span className="font-bold">TECHNICIAN: </span>{e.technician}</div>
                        </div>
                        <div className="text-[10px]">
                          <span className="font-bold">DESCRIPTION: </span>
                          <span className="whitespace-pre-wrap">{e.description}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button className="win-button text-[11px]" onClick={() => setStep('input')}>
                ← BACK
              </button>
              {parsed.length > 0 && (
                <button
                  className="win-button text-[11px] !bg-primary !text-primary-foreground"
                  onClick={handleImport}
                  disabled={bulkCreate.isPending}
                >
                  <Upload className="w-3 h-3 inline mr-1" />
                  {bulkCreate.isPending ? 'IMPORTING...' : `IMPORT ${parsed.length} ENTRIES`}
                </button>
              )}
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="text-center p-4 status-completed font-bold text-[13px]">
            ✓ {parsed?.length} {parsed?.length === 1 ? 'ENTRY' : 'ENTRIES'} IMPORTED SUCCESSFULLY
            <div className="mt-2">
              <button className="win-button text-[11px]" onClick={onClose}>CLOSE</button>
            </div>
          </div>
        )}
      </div>
    </WinWindow>
  );
}