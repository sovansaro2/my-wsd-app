import React from 'react';
import { cn } from '../../lib/utils';
import { BUTTON_STYLES, ButtonVariant } from '../../lib/buttonStyles';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'offWhiteBorder',
  children,
  className,
  ...props
}) => {
  return (
    <button
      {...props}
      className={cn(
        'w-full py-2.5 px-4 text-[14px] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        BUTTON_STYLES[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;
