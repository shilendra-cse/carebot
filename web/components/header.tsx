"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LogOut, Activity, Pill, Calendar, Heart, MessageCircle, LayoutDashboard, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/symptoms", label: "Symptoms", icon: Activity },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/mood", label: "Mood", icon: Heart },
  { href: "/history", label: "History", icon: FileText },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex w-full items-center justify-center px-4 md:px-10 py-3 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex w-full max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">CareBot</span>
        </Link>

        <nav className="flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          {user && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              {user.name}
            </span>
          )}
          <button
            onClick={logout}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
