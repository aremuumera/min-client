import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Box, Check, Globe } from 'lucide-react';
import { paths } from '@/config/paths';

export default function HomePage() {
  redirect(paths.auth.signIn);
}
