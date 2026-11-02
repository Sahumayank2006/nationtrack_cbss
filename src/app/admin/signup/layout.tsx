import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminSignupLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout hideLayoutForAuth>{children}</AdminLayout>;
}
