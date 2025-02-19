import React from 'react';

const sizes = {
  2: 'text-2xl',
  3: 'text-xl',
  4: 'text-lg',
  5: 'text-base',
}

type SidebarSectionProps = {
  title: string | React.ReactNode;
  level?: number;
  children?: React.ReactNode;
  className?: string;
};

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, level = 2, className }) => {
  if (level < 2 || level > 5) {
    throw new Error('Level must be between 2 and 5');
  }
  const textsize = sizes[level as keyof typeof sizes];
  return (
    <div className='rounded-xl outline outline-secondary-700/20 m-1 p-1'>
      {React.createElement(`h${level}`, { className: `${textsize} p-1` }, title)}
      <hr />
      <div className={`flex flex-col p-1 gap-1 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default SidebarSection;