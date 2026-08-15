import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  withText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  darkText?: boolean;
}

export const RattedOutBadge: React.FC<{ size?: number | string; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      {/* Dark Navy / Deep Purple Squircle Base */}
      <rect width="100" height="100" rx="26" fill="#251E52" />
      
      {/* Lavender / Soft Lilac Shield with Lightning Fracture */}
      <g fill="#D0CAFA">
        {/* Left Shield Half */}
        <path
          d="M 27 29 C 34 25.5 42 22.5 50 19 L 44.5 44 L 54.5 44 L 46 66 L 50 80 C 42 72.5 31 62 27 49 Z"
        />
        {/* Right Shield Half */}
        <path
          d="M 50 19 C 58 22.5 66 25.5 73 29 L 73 49 C 69 62 58 72.5 50 80 L 46 66 L 54.5 44 L 44.5 44 Z"
        />
      </g>
    </svg>
  );
};

export const RattedOutLogo: React.FC<LogoProps> = ({
  size = 40,
  className = '',
  withText = true,
  textSize = 'md',
  darkText = true,
}) => {
  const textClasses = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[textSize];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <RattedOutBadge size={size} />
      {withText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-black tracking-tight leading-none uppercase ${
              darkText ? 'text-[#0F172A]' : 'text-white'
            } ${textClasses}`}
          >
            Ratted Out
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider mt-0.5">
            Social Deduction
          </span>
        </div>
      )}
    </div>
  );
};
