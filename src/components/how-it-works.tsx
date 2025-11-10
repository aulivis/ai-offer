import { Upload, Wand2, Send } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      number: '01',
      title: 'Töltsd fel az adatokat',
      description: 'Add meg az ügyfél adatait vagy használd a meglévő adatbázist',
    },
    {
      icon: Wand2,
      number: '02',
      title: 'AI generálja az ajánlatot',
      description: 'Az AI 2 perc alatt professzionális ajánlatot készít',
    },
    {
      icon: Send,
      number: '03',
      title: 'Küldd el azonnal',
      description: 'Testreszabás után küldd el PDF-ben',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-turquoise-600 font-semibold text-sm uppercase tracking-wide mb-3">
            EGYSZERŰ FOLYAMAT
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4">Hogyan működik?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Három egyszerű lépésben professzionális ajánlatokat készíthetsz
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLastStep = index === steps.length - 1;

            return (
              <div key={step.number} className="relative">
                {!isLastStep && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-turquoise-300 to-transparent" />
                )}

                <div className="relative bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border-2 border-transparent hover:border-turquoise-200">
                  <div className="absolute -top-4 -left-4 bg-navy-900 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.number}
                  </div>

                  <div
                    className={`mb-6 w-16 h-16 rounded-lg ${index === 1 ? 'bg-navy-100' : 'bg-turquoise-100'} flex items-center justify-center`}
                  >
                    <Icon
                      className={`w-8 h-8 ${index === 1 ? 'text-navy-600' : 'text-turquoise-600'}`}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-navy-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 bg-turquoise-50 border-2 border-turquoise-200 px-6 py-3 rounded-full">
            <span className="text-2xl">⚡</span>
            <span className="font-semibold text-navy-900">
              Teljes folyamat: <span className="text-turquoise-600">~5 perc</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
