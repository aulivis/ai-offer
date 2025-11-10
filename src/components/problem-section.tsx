import { Clock, TrendingDown, FileX } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: Clock,
      title: 'Órákba telik egy professzionális ajánlat elkészítése',
      description: 'Minden alkalommal újra kell kezdeni, manuálisan kitölteni az összes adatot',
    },
    {
      icon: TrendingDown,
      title: 'Inkonzisztens dizájn és márkaidnetitás',
      description: 'Nehéz egységes megjelenést tartani minden ajánlatban',
    },
    {
      icon: FileX,
      title: 'Nehézkes együttműködés a csapat tagjai között',
      description: 'Verziókezelés és megosztás problémák lassítják a folyamatot',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-red-500 font-semibold text-sm uppercase tracking-wide mb-3">
            A PROBLÉMA
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-4 text-balance">
            Túl sok időt töltesz az ajánlatkészítéssel?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed text-pretty">
            A hagyományos ajánlatkészítés lassú, hibára hajlamos és nem skálázható. Minden
            projektnél újra kell kezdened a nulláról.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <div
                key={index}
                className="group bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-red-200 hover:-translate-y-1 min-h-[44px]"
              >
                {/* Icon with red accent */}
                <div className="mb-6 w-16 h-16 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors min-h-[64px] min-w-[64px]">
                  <Icon className="w-8 h-8 text-red-500" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-navy-900 mb-3 leading-snug text-balance">
                  {problem.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-pretty">{problem.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
