import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: false },
      { source: "/job-list", destination: "/jobs", permanent: false },
      { source: "/job-details/:id", destination: "/jobs/:id", permanent: false },
      { source: "/list-project", destination: "/projects", permanent: false },
      { source: "/user", destination: "/account", permanent: false },
      { source: "/profile/list-profiles", destination: "/profiles", permanent: false },
      { source: "/profile/profile-user/:id", destination: "/profiles/:id", permanent: false },
      { source: "/admin/list-user", destination: "/admin/users", permanent: false },
      { source: "/admin/list-company", destination: "/admin/companies", permanent: false },
      { source: "/manager/job", destination: "/manager/jobs", permanent: false },
      { source: "/manager/emloyee", destination: "/manager/employees", permanent: false },
      { source: "/manager/about", destination: "/manager/company", permanent: false },
      { source: "/manager/profile/profile-user/:id", destination: "/manager/profiles/:id", permanent: false }
    ];
  }
};

export default nextConfig;
