import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/saved?select=1');
}
