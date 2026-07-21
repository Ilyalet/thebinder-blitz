import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, Globe, Clock, Palette, User as UserIcon, Loader2 } from 'lucide-react';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Asia/Jerusalem', label: 'Israel (IST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'ILS', label: 'Israeli Shekel (₪)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)', example: '12/31/2024' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (UK/EU Format)', example: '31/12/2024' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)', example: '2024-12-31' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (German Format)', example: '31.12.2024' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '31-12-2024' },
  { value: 'MM/DD/YY', label: 'MM/DD/YY (Short US)', example: '12/31/24' },
  { value: 'DD/MM/YY', label: 'DD/MM/YY (Short UK/EU)', example: '31/12/24' },
];

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState({
    timezone: 'UTC',
    currency: 'USD',
    distance_unit: 'km',
    date_format: 'MM/DD/YYYY',
    family_name: '',
    full_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadUserSettings = useCallback(async () => {
    try {
      const user = await User.me();
      setUserSettings({
        timezone: user.timezone || 'UTC',
        currency: user.currency || 'USD',
        distance_unit: user.distance_unit || 'km',
        date_format: user.date_format || 'MM/DD/YYYY',
        family_name: user.family_name || '',
        full_name: user.full_name || '',
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast({ title: 'Error', description: 'Failed to load your settings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({
        timezone: userSettings.timezone,
        currency: userSettings.currency,
        distance_unit: userSettings.distance_unit,
        date_format: userSettings.date_format,
        family_name: userSettings.family_name,
      });
      toast({ title: 'Success', description: 'Your settings have been saved.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save your settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => setUserSettings((prev) => ({ ...prev, [key]: value }));

  const getCurrentTime = () => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: userSettings.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(new Date());
    } catch {
      return 'Invalid timezone';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account and preferences.</p>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Full name</Label>
              <p className="text-sm text-gray-600">{userSettings.full_name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-gray-600">{userSettings.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="currency">Currency</Label>
              <Select value={userSettings.currency} onValueChange={(v) => updateSetting('currency', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time & Date
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={userSettings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                Current time: <strong>{getCurrentTime()}</strong>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_format">Date format</Label>
              <Select value={userSettings.date_format} onValueChange={(v) => updateSetting('date_format', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                      <span className="text-xs text-gray-500 ml-2">({format.example})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="distance_unit">Distance unit</Label>
              <Select value={userSettings.distance_unit} onValueChange={(v) => updateSetting('distance_unit', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="km">Kilometers</SelectItem>
                  <SelectItem value="mile">Miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
