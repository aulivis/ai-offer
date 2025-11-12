'use client';

import { Check } from 'lucide-react';

interface VideoDescriptionProps {
  resource: {
    title: string;
  };
}

export function VideoDescription({ resource }: VideoDescriptionProps) {
  const learningPoints = [
    'Fiók létrehozása és beállítása',
    'A dashboard és főbb funkciók áttekintése',
    'Első ajánlat létrehozásának lépései',
    'Sablonok és testreszabási lehetőségek',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 mb-12">
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Erről szól a videó</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Ebben a bevezető videóban megismerkedhetsz a Vyndi platform alapvető funkcióival.
          Megtanulod, hogyan hozz létre fiókot, állítsd be a profilt, és kezdd el használni az
          ajánlatkészítő eszközöket. A videó végére készen állsz az első ajánlatod elkészítésére.
        </p>

        <h3 className="font-bold text-gray-900 mb-3">Mit fogsz megtanulni?</h3>
        <ul className="space-y-2 mb-6">
          {learningPoints.map((point, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>

        {/* Instructor info */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="font-bold text-gray-900 mb-4">Oktató</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {resource.title.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">Vyndi Csapat</div>
              <div className="text-sm text-gray-600 mb-1">Marketing szakértők</div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>15 videó</span>
                <span>•</span>
                <span>3,240 megtekintés</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
