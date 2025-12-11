import { Clock, TrendingDown, FileX, AlertCircle } from 'lucide-react';
import { FeatureIndicators } from './FeatureIndicators';
import { LandingCTA } from './ui/LandingCTA';

export function ProblemSection() {
  const problems = [
    {
      icon: Clock,
      title: 'Órákba telik egyetlen ajánlat elkészítése',
      description:
        'Minden alkalommal elölről kell kezdeni, manuálisan kitölteni az adatokat és formázni a dokumentumot',
      stat: { value: '3-5 óra', label: 'átlagos elkészítési idő', color: 'text-danger' },
      gradient: 'from-danger/80 to-danger',
    },
    {
      icon: TrendingDown,
      title: 'Nehezen tartható az egységes dizájn',
      description:
        'A kézi formázás miatt az ajánlatok gyakran eltérnek egymástól, ami rontja a professzionális benyomást.',
      stat: { value: '65%', label: 'az ajánlatok közül nem márkahű', color: 'text-warning' },
      gradient: 'from-warning to-danger',
    },
    {
      icon: FileX,
      title: 'A csapatmunka lassítja a folyamatot',
      description:
        'Verziókezelési gondok, e-mail láncok, félreértések – mindez időveszteséghez és hibákhoz vezet.',
      stat: { value: '8+', label: 'e-mail váltás projektenként', color: 'text-danger' },
      gradient: 'from-danger to-danger/90',
    },
  ];

  return (
    <section className="py-24 bg-bg-muted">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Enhanced badge with more prominent red color */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger rounded-full font-semibold text-sm mb-6 border border-danger/20">
            <AlertCircle className="w-4 h-4" />A PROBLÉMA
          </div>

          {/* Larger, bolder headline with better hierarchy */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-navy-900 mb-6 leading-tight text-balance">
            Ismerős, hogy órákig tart egy ajánlat összeállítása?
          </h2>

          {/* Improved line-height for better readability */}
          <p className="text-xl md:text-2xl text-fg-muted max-w-4xl mx-auto leading-relaxed text-pretty">
            A kézi ajánlatkészítés időigényes, hibalehetőségekkel teli, és minden projektet
            újrakezdesz a nulláról.
          </p>
        </div>

        {/* Pain Points Grid */}
        {/* Increased gap for better breathing room */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {problems.map((problem, index) => {
            const Icon = problem.icon;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-border text-center"
              >
                {/* Larger icon with gradient background for more impact */}
                <div
                  className={`w-20 h-20 bg-gradient-to-br ${problem.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg mx-auto`}
                >
                  <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>

                {/* Bolder title with better spacing */}
                <h3 className="text-2xl font-bold text-navy-900 mb-4 leading-tight text-balance">
                  {problem.title}
                </h3>

                {/* Increased line-height for easier reading */}
                <p className="text-fg-muted leading-relaxed text-pretty">{problem.description}</p>

                {/* Optional: Add emphasis stat */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className={`text-3xl font-bold ${problem.stat.color}`}>
                    {problem.stat.value}
                  </div>
                  <div className="text-sm text-fg-muted">{problem.stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional: Add transition element or CTA */}
        <div className="text-center mt-16">
          <p className="text-xl text-fg font-semibold mb-4 text-pretty">
            Ismerősek ezek a helyzetek?
          </p>
          <p className="text-fg-muted max-w-2xl mx-auto mb-6 text-pretty">
            A Vyndi pontosan ezeket a problémákat oldja meg mesterséges intelligencia alapú
            automatizálással.
          </p>
          <LandingCTA href="#solution">Nézd meg, hogyan működik</LandingCTA>
          <div className="mt-6">
            <FeatureIndicators mobileOnly={['fast']} />
          </div>
        </div>
      </div>
    </section>
  );
}
