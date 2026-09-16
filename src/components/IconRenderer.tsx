import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconRendererProps {
  iconName: string;
  className?: string;
  color?: string;
}

export function IconRenderer({ iconName, className = "w-5 h-5", color }: IconRendererProps) {
  // Try to find the exact match or convert kebab-case to PascalCase (e.g., 'credit-card' -> 'CreditCard')
  const pascalName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const IconComp = (LucideIcons as any)[pascalName] || LucideIcons.Circle;

  return <IconComp className={className} style={color ? { color } : undefined} />;
}
