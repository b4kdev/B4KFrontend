import type { ReactNode } from 'react';

/** One numbered section of a legal document (content/legal/*). */
export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};
