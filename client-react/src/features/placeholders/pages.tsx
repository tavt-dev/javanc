import { Briefcase } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border bg-card">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Coming in next phases</p>
      </div>
    </div>
  );
}

export function ProfilePage() {
  return <PlaceholderPage title="My Profile" description="Manage your professional profile" />;
}
export function ProfileSearchPage() {
  return <PlaceholderPage title="Profiles" description="Search and browse profiles" />;
}
export function ProfileDetailPage() {
  return <PlaceholderPage title="Profile Detail" description="View profile details" />;
}
export function ProjectsPage() {
  return <PlaceholderPage title="My Projects" description="Manage your portfolio projects" />;
}
export function NotificationsPage() {
  return <PlaceholderPage title="Notifications" description="Your notifications" />;
}
export function CompaniesPage() {
  return <PlaceholderPage title="Companies" description="Browse companies" />;
}
export function CompanyDetailPage() {
  return <PlaceholderPage title="Company Detail" description="Company information" />;
}
export function JobBoardPage() {
  return <PlaceholderPage title="Job Board" description="Browse available positions" />;
}
export function JobDetailPage() {
  return <PlaceholderPage title="Job Detail" description="Position details" />;
}
export function MyApplicationsPage() {
  return <PlaceholderPage title="My Applications" description="Track your job applications" />;
}
export function ManageJobsPage() {
  return <PlaceholderPage title="Manage Jobs" description="Create and manage job postings" />;
}
export function MyCompanyPage() {
  return <PlaceholderPage title="My Company" description="Manage your company" />;
}
export function ManageHRPage() {
  return <PlaceholderPage title="Manage HR" description="Assign HR accounts" />;
}
export function UserManagementPage() {
  return <PlaceholderPage title="User Management" description="Manage user accounts" />;
}
export function CompanyManagementPage() {
  return <PlaceholderPage title="Company Management" description="Create and manage companies" />;
}
export function SettingsPage() {
  return <PlaceholderPage title="Settings" description="Application preferences" />;
}
