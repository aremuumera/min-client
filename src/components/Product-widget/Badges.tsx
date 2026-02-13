import { Chip } from '@/components/ui/chip';
import React from 'react';
import { GiMining } from 'react-icons/gi';
import { MdVerified } from 'react-icons/md';

interface BadgeProps {
  label: string;
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
  icon?: boolean;
}

export const PromoBadges = ({ label, color }: BadgeProps) => {
  return (
    <div>
      <Chip label={label} color={color} size="sm" className="text-[0.6em] h-4" />
    </div>
  );
};

export const VerifiedBadges = ({ label, color, className }: BadgeProps) => {
  return (
    <div>
      <Chip
        label={label}
        variant="outlined"
        color={color}
        size="sm"
        className={`text-[1em] h-[1.5rem] border-2 border-black ${className || ''}`}
        icon={<MdVerified />}
      />
    </div>
  );
};

export const NormalBadges = ({ label, color, className }: BadgeProps) => {
  return (
    <div>
      <Chip
        label={label}
        variant="outlined"
        color={color}
        size="sm"
        className={`h-8 bg-[#16b364] ${className || ''}`}
        icon={<GiMining />}
      />
    </div>
  );
};
