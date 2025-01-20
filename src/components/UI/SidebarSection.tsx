import React from 'react';

type SidebarSectionProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, className }) => {
  return (
    <>
      <h2 className='text-2xl p-1'>{title}</h2>
      <hr />
      <div className={`flex flex-col p-1 gap-1 ${className}`}>
        {children}
      </div>
    </>
  );
};

export default SidebarSection;