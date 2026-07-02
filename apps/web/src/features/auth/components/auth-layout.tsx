"use client";

import Image from "next/image";
import { Card, CardContent } from "@/shared/ui/card";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <Card className="w-full max-w-md bg-card border-border shadow-[0_0_40px_-10px] shadow-primary/20">
      <CardContent className="pt-8 pb-6 px-6 sm:px-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 border border-border">
            <Image
              src="/icon.png"
              alt="Pitvia Logo"
              width={64}
              height={64}
              className="object-contain rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        {children}
      </CardContent>
    </Card>
  );
}
