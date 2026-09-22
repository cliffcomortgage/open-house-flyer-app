"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    setIsChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to change password");
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          Your Account
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={onChangePassword} className="space-y-4 max-w-sm">
          <div>
            <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700 mb-1.5 block">
              Current password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              className="h-9"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700 mb-1.5 block">
              New password
            </Label>
            <Input
              id="newPassword"
              type="password"
              className="h-9"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 mb-1.5 block">
              Confirm new password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              className="h-9"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isChanging}>
            {isChanging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Update Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
