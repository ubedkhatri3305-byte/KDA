// Auth pages have their own full-screen layout — no navbar or footer
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
