"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
}
