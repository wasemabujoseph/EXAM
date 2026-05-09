import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  size = 'md',
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
      className={`medexam-brand-logo ${className}`} 
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center', 
        flexWrap: 'nowrap',
        justifyContent: className.includes('justify-center') ? 'center' : 'flex-start',
        gap: size === 'sm' ? '8px' : '12px'
      }}
      aria-label="MEDEXAM AI Medical Learning Assistant"
    >
      <div className="logo-symbol flex-shrink-0 relative flex items-center justify-center">
        <img 
          src="/brand/medexam-logo-light.svg" 
          alt="MEDEXAM Symbol" 
          className="logo-img-light block object-contain"
        />
        <img 
          src="/brand/medexam-logo-dark.svg" 
          alt="MEDEXAM Symbol" 
          className="logo-img-dark hidden object-contain"
        />
      </div>

      {variant !== 'icon' && (
        <div className="logo-text-stack flex flex-col justify-center leading-none flex-shrink">
          <div className={`brand-name font-black tracking-tighter ${current.name} whitespace-nowrap flex`}>
            <span className="text-[#0B3D91] dark:text-blue-400">MED</span>
            <span className="text-[#00B2A9] dark:text-[#27C6F6]">EXAM</span>
          </div>
        </div>
      )}

      <style>{`
        .medexam-brand-logo {
          background: transparent !important;
          max-width: 100%;
        }
        .medexam-brand-logo .logo-symbol img {
          width: ${current.icon}px;
          height: ${current.icon}px;
          transition: all 0.2s ease;
        }
        
        /* Mobile specific adjustments */
        @media (max-width: 640px) {
          .medexam-brand-logo .logo-symbol img {
            width: ${Math.max(22, Math.floor(current.icon * 0.8))}px;
            height: ${Math.max(22, Math.floor(current.icon * 0.8))}px;
          }
          .medexam-brand-logo .brand-name {
            font-size: 0.9em;
          }
        }

        .medexam-brand-logo .brand-name {
          font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
          transition: color 0.3s ease;
        }
        
        /* Theme switching for logo images */
        html[data-theme="dark"] .logo-img-light { display: none !important; }
        html[data-theme="dark"] .logo-img-dark { display: block !important; }
        
        /* Default state */
        .logo-img-dark { display: none; }
        .logo-img-light { display: block; }

        /* Ensure smooth rendering */
        .medexam-brand-logo img {
          image-rendering: -webkit-optimize-contrast;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default BrandLogo;
