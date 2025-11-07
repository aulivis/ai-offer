interface GuaranteeBadgeProps {
  className?: string;
}

export default function GuaranteeBadge({ className = '' }: GuaranteeBadgeProps) {
  return (
    <div className={`flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-6 ${className}`}>
      <div className="flex-shrink-0">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-fg">100% Elégedettségi Garancia</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Ha nem vagy elégedett a Propono-val az első 30 napban, teljes visszatérítést kapsz. Nincs
          kockázat, nincs kötelezettség.
        </p>
      </div>
    </div>
  );
}







