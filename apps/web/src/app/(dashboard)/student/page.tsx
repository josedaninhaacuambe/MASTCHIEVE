'use client';

import { useAuthStore } from '@/stores/auth.store';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';

export default function StudentProfilePage() {
  const { user } = useAuthStore();
  return <StudentDashboard user={user} />;
}
