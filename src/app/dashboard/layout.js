import DashboardLayout from '@/components/Layout/DashboardLayout';

// Layout مشترك لجميع صفحات الداشبورد
// هذا Layout يطبق DashboardLayout (Sidebar + Header) على جميع الصفحات الفرعية
export default function Layout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
