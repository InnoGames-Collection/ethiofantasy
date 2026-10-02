import React from 'react';
import officialLogoSvg from '../../assets/ethiofantasy_official_logo.svg';

interface EthioFantasyLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

export const EthioFantasyLogo: React.FC<EthioFantasyLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  // Height scales with strict aspect ratio preservation (SVG viewBox is 1000 x 660 ≈ 1.52 : 1)
  const sizeClasses = {
    sm: 'h-8 sm:h-9 w-auto',
    md: 'h-9 sm:h-10 w-auto',
    lg: 'h-14 sm:h-16 w-auto',
    xl: 'h-20 sm:h-22 w-auto',
    hero: 'h-24 sm:h-28 w-auto',
  };

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={officialLogoSvg}
        alt="EthioFantasy - Play • Compete • Win"
        className={`${sizeClasses[size]} max-w-full object-contain shrink-0`}
        draggable={false}
      />
    </div>
  );
};
