import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  bgColorClass?: string;
  textColorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  description,
  bgColorClass = 'bg-green-500', 
  textColorClass = 'text-white' 
}) => {
  return (
    <div className={`shadow-lg rounded-xl p-6 ${bgColorClass} ${textColorClass} flex items-center space-x-4`}>
      <div className="flex-shrink-0 p-3 bg-white bg-opacity-20 rounded-full">
        {React.isValidElement(icon) ? 
            React.cloneElement<React.SVGProps<SVGSVGElement>>(icon as React.ReactElement, { className: "h-8 w-8" })
          : icon
        }
      </div>
      <div>
        <p className="text-sm font-medium uppercase tracking-wider opacity-80">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {description && <p className="text-xs opacity-70">{description}</p>}
      </div>
    </div>
  );
};