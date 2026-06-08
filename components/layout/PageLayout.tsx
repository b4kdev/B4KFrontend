interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <main
      className={[
        'min-h-screen pt-[52px] pb-14 lg:pb-0',
        'lg:ml-[52px]',
        className,
      ].join(' ')}
    >
      {children}
    </main>
  );
}
