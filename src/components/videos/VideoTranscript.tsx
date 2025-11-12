'use client';

import { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';

interface TranscriptItem {
  time: string;
  text: string;
}

interface VideoTranscriptProps {
  transcript: TranscriptItem[];
}

export function VideoTranscript({ transcript }: VideoTranscriptProps) {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
          aria-expanded={showTranscript}
          aria-label="Videó átirat megnyitása"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-teal-500" />
            <div className="text-left">
              <h3 className="font-bold text-gray-900">Videó átirat</h3>
              <p className="text-sm text-gray-600">Teljes szöveges verzió olvasáshoz</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${
              showTranscript ? 'rotate-180' : ''
            }`}
          />
        </button>

        {showTranscript && (
          <div className="px-6 pb-6 border-t border-gray-200 pt-6">
            <div className="prose prose-sm max-w-none">
              {transcript.map((item, index) => (
                <p key={index} className="text-gray-700 mb-2">
                  <span className="font-mono font-semibold text-teal-600 mr-2">[{item.time}]</span>
                  {item.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
