import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
  showSubtitle = true,
  className = ''
}) => {
  // Size mapping for flexible usage
  const sizeMap = {
    sm: { icon: 26, name: 'text-lg', sub: 'text-[0.6rem]' },
    md: { icon: 36, name: 'text-xl', sub: 'text-[0.7rem]' },
    lg: { icon: 56, name: 'text-3xl', sub: 'text-[0.85rem]' },
    xl: { icon: 80, name: 'text-5xl', sub: 'text-[1rem]' }
  };

  const current = sizeMap[size];

  return (
    <div 
      className={`medexam-brand-logo flex items-center gap-3 ${className}`} 
      aria-label="MEDEXAM AI Medical Learning Assistant"
    >
      <div className="logo-symbol flex-shrink-0 relative">
        <img 
          src="/brand/medexam-logo-light.svg" 
          alt="MEDEXAM Symbol" 
          style={{ width: current.icon, height: current.icon }}
          className="logo-img-light block object-contain"
        />
        <img 
          src="/brand/medexam-logo-dark.svg" 
          alt="MEDEXAM Symbol" 
          style={{ width: current.icon, height: current.icon }}
          className="logo-img-dark hidden object-contain"
        />
      </div>

      {variant !== 'icon' && (
        <div className="logo-text-stack flex flex-col justify-center leading-[1.1]">
          <span className={`brand-name font-black tracking-tighter ${current.name} text-[#053579] dark:text-white`}>
            MEDEXAM
          </span>
          {((variant === 'full') || (variant === 'compact' && showSubtitle)) && (
            <span className={`brand-subtitle font-bold tracking-wider uppercase opacity-60 ${current.sub} text-slate-600 dark:text-slate-400 mt-0.5`}>
              AI Medical Learning Assistant
            </span>
          )}
        </div>
      )}

      <style>{`
        .medexam-brand-logo .brand-name {
          font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
          transition: color 0.3s ease;
        }
        .medexam-brand-logo .brand-subtitle {
          font-family: 'Inter', system-ui, sans-serif;
          transition: color 0.3s ease;
        }
        
        /* Theme switching for logo images */
        .logo-img-dark { display: none; }
        .logo-img-light { display: block; }
        
        html.dark .logo-img-light { display: none; }
        html.dark .logo-img-dark { display: block; }

        /* Ensure smooth rendering */
        .medexam-brand-logo img {
          image-rendering: -webkit-optimize-contrast;
        }
      `}</style>
    </div>
  );
};

export default BrandLogo;
