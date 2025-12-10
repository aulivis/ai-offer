type FeatureType = 'free' | 'noCard' | 'fast';

interface FeatureIndicatorsProps {
  mobileOnly?: FeatureType[];
}

export function FeatureIndicators({ mobileOnly }: FeatureIndicatorsProps = {}) {
  const features = [
    {
      id: 'free' as const,
      label: 'Kezdd el teljesen ingyen',
    },
    {
      id: 'noCard' as const,
      label: 'Nem kérünk bankkártyát',
    },
    {
      id: 'fast' as const,
      label: 'Kész ajánlat 5 perc alatt',
    },
  ];

  return (
    <div className="flex flex-wrap gap-8 justify-center text-sm">
      {features.map((feature) => {
        // If mobileOnly is specified, on mobile only show those features
        // On desktop (md+), always show all features
        const shouldHideOnMobile = mobileOnly && !mobileOnly.includes(feature.id);

        return (
          <div
            key={feature.id}
            className={`flex items-center gap-2 ${shouldHideOnMobile ? 'hidden md:flex' : 'flex'}`}
          >
            <svg className="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>{feature.label}</span>
          </div>
        );
      })}
    </div>
  );
}
