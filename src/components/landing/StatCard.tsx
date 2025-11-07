interface StatCardProps {
  value: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({ value, label, icon, className = '' }: StatCardProps) {
  return (
    <div className={`text-center ${className}`}>
      {icon && <div className="mb-3 flex justify-center">{icon}</div>}
      <div className="text-4xl font-bold text-primary md:text-5xl">{value}</div>
      <div className="mt-2 text-sm font-medium text-fg-muted md:text-base">{label}</div>
    </div>
  );
}







