import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect halaman utama (/) langsung ke halaman login
  redirect('/login');
}
