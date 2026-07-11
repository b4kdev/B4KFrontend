import Footer from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <main
      className={[
        'min-h-screen flex flex-col pt-[50px] pb-14 lg:pb-0',
        'lg:ml-[50px]',
        className,
      ].join(' ')}
    >
      <div className="flex-1">{children}</div>
      <Footer />
    </main>
  );
}
