"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "vi";

type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
  en: {
    "nav.profiles": "Profiles",
    "nav.jobs": "Jobs",
    "nav.companies": "Companies",
    "nav.projects": "Projects",
    "nav.admin": "Admin",
    "nav.manager": "Manager",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Log out",
    "nav.account": "Account",
    "shell.subtitle": "Talent operations",
    "footer.product": "A practical workspace for portfolios, hiring teams, companies, and career opportunities.",
    "footer.platform": "Explore",
    "footer.operations": "Workspaces",
    "footer.rights": "JavaNC helps teams connect talent with the right opportunities.",
    "home.eyebrow": "Talent and portfolio workspace",
    "home.title": "Find talent, manage opportunities, and showcase professional work.",
    "home.description":
      "Discover standout profiles, review projects, follow companies, and manage hiring activity in one focused workspace.",
    "home.browseProfiles": "Browse profiles",
    "home.viewJobs": "View jobs",
    "home.searchLabel": "Search the workspace",
    "home.searchPlaceholder": "Search by keyword",
    "home.searchButton": "Search",
    "home.metricProfiles": "Profiles",
    "home.metricCompanies": "Companies",
    "home.metricJobs": "Jobs",
    "home.talent": "Talent",
    "home.discoverProfiles": "Discover profiles",
    "home.profileDescription": "Explore candidate portfolios, skills, experience, and contact details.",
    "home.allProfiles": "All profiles",
    "home.noProfiles": "No profiles yet",
    "home.noProfilesDescription": "Profiles will appear here as candidates create their portfolios.",
    "home.outstandingCompanies": "Outstanding companies",
    "home.openOpportunities": "Open opportunities",
    "home.noCompanies": "No companies found",
    "home.noCompaniesDescription": "Companies will appear here as new organizations join the platform.",
    "home.noJobs": "No jobs found",
    "home.noJobsDescription": "New openings will appear here as hiring teams publish them.",
    "auth.loginEyebrow": "Welcome back",
    "auth.loginTitle": "Login to your workspace.",
    "auth.loginDescription": "Manage your profile, projects, applications, companies, and hiring activity.",
    "auth.registerEyebrow": "Create account",
    "auth.registerTitle": "Join JavaNC",
    "auth.registerDescription": "Create an account to build your profile, publish work, or manage hiring activity.",
    "state.loading": "Loading data",
    "state.loadingDetails": "Preparing your workspace"
  },
  vi: {
    "nav.profiles": "Hồ sơ",
    "nav.jobs": "Việc làm",
    "nav.companies": "Công ty",
    "nav.projects": "Dự án",
    "nav.admin": "Quản trị",
    "nav.manager": "Quản lý",
    "nav.login": "Đăng nhập",
    "nav.register": "Đăng ký",
    "nav.logout": "Đăng xuất",
    "nav.account": "Tài khoản",
    "shell.subtitle": "Vận hành tuyển dụng",
    "footer.product": "Không gian làm việc cho portfolio, đội ngũ tuyển dụng, công ty và cơ hội nghề nghiệp.",
    "footer.platform": "Khám phá",
    "footer.operations": "Workspace",
    "footer.rights": "JavaNC giúp kết nối nhân tài với cơ hội phù hợp.",
    "home.eyebrow": "Workspace hồ sơ và tuyển dụng",
    "home.title": "Tìm nhân tài, quản lý cơ hội việc làm và trưng bày sản phẩm nghề nghiệp.",
    "home.description":
      "Khám phá hồ sơ nổi bật, xem dự án, theo dõi công ty và quản lý hoạt động tuyển dụng trong một workspace tập trung.",
    "home.browseProfiles": "Xem hồ sơ",
    "home.viewJobs": "Xem việc làm",
    "home.searchLabel": "Tìm kiếm workspace",
    "home.searchPlaceholder": "Tìm theo từ khóa",
    "home.searchButton": "Tìm kiếm",
    "home.metricProfiles": "Hồ sơ",
    "home.metricCompanies": "Công ty",
    "home.metricJobs": "Việc làm",
    "home.talent": "Nhân tài",
    "home.discoverProfiles": "Khám phá hồ sơ",
    "home.profileDescription": "Xem portfolio, kỹ năng, kinh nghiệm và thông tin liên hệ của ứng viên.",
    "home.allProfiles": "Tất cả hồ sơ",
    "home.noProfiles": "Chưa có hồ sơ",
    "home.noProfilesDescription": "Hồ sơ sẽ hiển thị khi ứng viên tạo portfolio.",
    "home.outstandingCompanies": "Công ty nổi bật",
    "home.openOpportunities": "Cơ hội việc làm",
    "home.noCompanies": "Chưa có công ty",
    "home.noCompaniesDescription": "Công ty sẽ hiển thị khi có tổ chức mới tham gia.",
    "home.noJobs": "Chưa có việc làm",
    "home.noJobsDescription": "Việc làm mới sẽ hiển thị khi nhà tuyển dụng đăng tin.",
    "auth.loginEyebrow": "Chào mừng trở lại",
    "auth.loginTitle": "Đăng nhập vào workspace của bạn.",
    "auth.loginDescription": "Quản lý hồ sơ, dự án, đơn ứng tuyển, công ty và hoạt động tuyển dụng.",
    "auth.registerEyebrow": "Tạo tài khoản",
    "auth.registerTitle": "Tham gia JavaNC",
    "auth.registerDescription": "Tạo tài khoản để xây dựng hồ sơ, đăng dự án hoặc quản lý tuyển dụng.",
    "state.loading": "Đang tải dữ liệu",
    "state.loadingDetails": "Đang chuẩn bị workspace của bạn"
  }
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("language");
    if (stored === "en" || stored === "vi") {
      setLanguageState(stored);
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        window.localStorage.setItem("language", nextLanguage);
      },
      t(key) {
        return dictionaries[language][key] ?? dictionaries.en[key] ?? key;
      }
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
