interface TrustBadge {
  icon: React.ReactNode;
  text: string;
}

interface TrustBadgesProps {
  badges: TrustBadge[];
  className?: string;
}

export default function TrustBadges({ badges, className = '' }: TrustBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-8 ${className}`}>
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-3 text-sm text-fg-muted">
          {badge.icon}
          <span className="font-medium">{badge.text}</span>
        </div>
      ))}
    </div>
  );
}





