import React, { useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

interface Platform {
  name: string;
  url: string;
}

interface NavigationLinkProps {
  icon?: React.ReactNode;
  label: string;
  href: string;
  description?: string;
  platforms?: Platform[];
}

export const NavigationLink: React.FC<NavigationLinkProps> = ({
  icon,
  label,
  href,
  description,
  platforms
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        href={href}
        className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </a>
      
      {platforms && isHovered && (
        <div 
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 rounded-md shadow-lg bg-white/10 backdrop-blur-sm"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-1">
            {platforms.map((platform, index) => (
              <a
                key={index}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                {platform.name}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};