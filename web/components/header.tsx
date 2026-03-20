"use client";

import { Bot, User, Settings } from "lucide-react";

export default function Header() {
  return (
    <div className="flex w-full h-13 items-center justify-center px-10 py-3 border-b">
      {/* Logo and Brand */}
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center space-x-3 ">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">CareBot</span>
            <span className="text-xs text-muted-foreground">Your personal healthcare assistant</span>
          </div>
        </div>

        {/* Center Navigation */}
        <div className="flex items-center space-x-6">
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors">
            <Settings className="h-4 w-4" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
