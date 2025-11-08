"use client";

import { useProfile, useUpdateProfile } from "@/library/api/hooks/use-profile";
import { Badge } from "@/library/components/atoms/badge";
import { Button } from "@/library/components/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/library/components/atoms/card";
import { Input } from "@/library/components/atoms/input";
import { Label } from "@/library/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/library/components/atoms/select";
import { Separator } from "@/library/components/atoms/separator";
import { Skeleton } from "@/library/components/atoms/skeleton";
import { Switch } from "@/library/components/atoms/switch";
import { Bell, Mail, Monitor, Moon, Palette, Smartphone, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    trades: true,
  });

  const [userSettings, setUserSettings] = useState({
    email: "",
    language: "en",
    timezone: "UTC",
    currency: "USD",
  });

  // Initialize userSettings from profile data
  useEffect(() => {
    if (profile) {
      setUserSettings({
        email: profile.email || "",
        language: profile.settings?.language || "en",
        timezone: profile.settings?.timezone || "UTC",
        currency: profile.settings?.currency || "USD",
      });
    }
  }, [profile]);

  const handleSaveSettings = () => {
    const { email, ...settingsData } = userSettings;
    updateProfile.mutate({
      email: email !== profile?.email ? email : undefined,
      settings: settingsData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and application preferences
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-600 border-blue-500/20"
        >
          {profile?.email}
        </Badge>
      </div>

      {/* Account Settings - Primary */}
      <AccountSettingsSection
        userSettings={userSettings}
        setUserSettings={setUserSettings}
        onSave={handleSaveSettings}
        isSaving={updateProfile.isPending}
      />

      {/* Theme & Preferences - Secondary */}
      <ThemePreferencesSection
        theme={theme}
        setTheme={setTheme}
        userSettings={userSettings}
        setUserSettings={setUserSettings}
      />

      {/* Notifications - Secondary */}
      <NotificationsSection
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </div>
  );
}

function AccountSettingsSection({
  userSettings,
  setUserSettings,
  onSave,
  isSaving,
}: {
  userSettings: any;
  setUserSettings: (settings: any) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-500" />
          Account Settings
          <Badge variant="secondary" className="text-xs">
            Primary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your basic account information and preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userSettings.email}
              onChange={(e) =>
                setUserSettings({
                  ...userSettings,
                  email: e.target.value,
                })
              }
              placeholder="your@email.com"
            />
            <p className="text-xs text-muted-foreground">
              Used for login and important notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={userSettings.language}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  language: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={userSettings.timezone}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  timezone: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                <SelectItem value="Europe/London">London</SelectItem>
                <SelectItem value="Europe/Paris">Paris</SelectItem>
                <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Display Currency</Label>
            <Select
              value={userSettings.currency}
              onValueChange={(value) =>
                setUserSettings({
                  ...userSettings,
                  currency: value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="JPY">JPY (¥)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Account Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function ThemePreferencesSection({
  theme,
  setTheme,
  userSettings,
  setUserSettings,
}: {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  userSettings: any;
  setUserSettings: (settings: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-500" />
          Theme & Preferences
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Customize your visual experience and interface preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
                className="flex items-center gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="MM/DD/YYYY">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number Format</Label>
              <Select defaultValue="1,234.56">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1,234.56">1,234.56</SelectItem>
                  <SelectItem value="1.234,56">1.234,56</SelectItem>
                  <SelectItem value="1 234.56">1 234.56</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function NotificationsSection({
  notifications,
  setNotifications,
}: {
  notifications: any;
  setNotifications: (notifications: any) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-orange-500" />
          Notifications
          <Badge variant="outline" className="text-xs">
            Secondary
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control what notifications you receive and how
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Trade Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Get notified when trades are executed or require approval
              </p>
            </div>
            <Switch
              checked={notifications.trades}
              onCheckedChange={(checked) =>
                setNotifications({
                  ...notifications,
                  trades: checked,
                })
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Methods</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Mail className="h-4 w-4 text-blue-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Email</div>
                <div className="text-xs text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Smartphone className="h-4 w-4 text-green-500" />
              <div className="flex-1">
                <div className="text-sm font-medium">Push Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Browser push notifications
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
