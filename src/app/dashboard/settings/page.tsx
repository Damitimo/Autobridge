'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Settings,
  DollarSign,
  Bell,
  Loader2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
} from 'lucide-react';

interface CostIntelligencePrefs {
  showVehiclePrice: boolean;
  showAuctionFee: boolean;
  showTowing: boolean;
  showShipping: boolean;
  showInsurance: boolean;
  showCustomsDuty: boolean;
  showPortCharges: boolean;
  showClearingFee: boolean;
  showServiceFee: boolean;
  showLocalDelivery: boolean;
  showTotal: boolean;
}

interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface Preferences {
  defaultCurrency: 'USD' | 'NGN';
  costIntelligence: CostIntelligencePrefs;
  notifications: NotificationPrefs;
}

const COST_ITEMS = [
  { key: 'showCustomsDuty', label: 'Nigerian Customs Duty', description: 'Import duty & levies' },
  { key: 'showPortCharges', label: 'Port Charges', description: 'Terminal handling & demurrage' },
  { key: 'showClearingFee', label: 'Clearing Agent Fee', description: 'Customs clearance services' },
  { key: 'showLocalDelivery', label: 'Local Delivery', description: 'Port to your location' },
];

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>({
    defaultCurrency: 'USD',
    costIntelligence: {
      showVehiclePrice: true,
      showAuctionFee: true,
      showTowing: true,
      showShipping: true,
      showInsurance: true,
      showCustomsDuty: true,
      showPortCharges: true,
      showClearingFee: true,
      showServiceFee: true,
      showLocalDelivery: true,
      showTotal: true,
    },
    notifications: {
      email: true,
      sms: true,
      push: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/preferences', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.preferences) {
        setPreferences(prev => ({
          ...prev,
          ...data.preferences,
          costIntelligence: {
            ...prev.costIntelligence,
            ...(data.preferences.costIntelligence || {}),
          },
          notifications: {
            ...prev.notifications,
            ...(data.preferences.notifications || {}),
          },
        }));
      } else if (!data.success) {
        setError(data.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      const data = await response.json();

      if (data.success) {
        // Store currency preference in localStorage for immediate use
        localStorage.setItem('defaultCurrency', preferences.defaultCurrency);
        // Dispatch event so other components can react
        window.dispatchEvent(new CustomEvent('currencyChanged', { detail: preferences.defaultCurrency }));
        setSuccess('Preferences saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleCostItem = (key: string) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      costIntelligence: {
        ...preferences.costIntelligence,
        [key]: !preferences.costIntelligence[key as keyof CostIntelligencePrefs],
      },
    });
  };

  const toggleAllCostItems = (show: boolean) => {
    if (!preferences) return;

    const updated: CostIntelligencePrefs = {
      showVehiclePrice: show,
      showAuctionFee: show,
      showTowing: show,
      showShipping: show,
      showInsurance: show,
      showCustomsDuty: show,
      showPortCharges: show,
      showClearingFee: show,
      showServiceFee: show,
      showLocalDelivery: show,
      showTotal: true, // Always show total
    };

    setPreferences({
      ...preferences,
      costIntelligence: updated,
    });
  };

  const toggleNotification = (key: keyof NotificationPrefs) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: !preferences.notifications[key],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Customize your AutoBridge experience</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5" />
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Default Currency Preference */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Display Currency
          </CardTitle>
          <CardDescription>
            Choose your preferred currency for displaying amounts throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:gap-8 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="currency"
                checked={preferences.defaultCurrency === 'USD'}
                onChange={() => setPreferences(prev => ({ ...prev, defaultCurrency: 'USD' }))}
                className="w-4 h-4 text-brand-dark focus:ring-brand-dark"
              />
              <span className="font-medium">US Dollar (USD)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="currency"
                checked={preferences.defaultCurrency === 'NGN'}
                onChange={() => setPreferences(prev => ({ ...prev, defaultCurrency: 'NGN' }))}
                className="w-4 h-4 text-brand-dark focus:ring-brand-dark"
              />
              <span className="font-medium">Nigerian Naira (NGN)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Cost Intelligence Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Intelligence
          </CardTitle>
          <CardDescription>
            Choose which cost items to display in the cost breakdown when viewing vehicles.
            Hide items you don&apos;t need to see for a cleaner view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Actions */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllCostItems(true)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              Show All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleAllCostItems(false)}
              className="flex items-center gap-1"
            >
              <EyeOff className="h-4 w-4" />
              Hide All
            </Button>
          </div>

          {/* Cost Items */}
          <div className="space-y-4">
            {COST_ITEMS.map((item) => {
              const isChecked = preferences?.costIntelligence[item.key as keyof CostIntelligencePrefs] ?? true;
              const isTotal = item.key === 'showTotal';

              return (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-3 ${
                    isTotal ? 'border-t pt-4 mt-2' : ''
                  }`}
                >
                  <div className="flex-1">
                    <Label
                      htmlFor={item.key}
                      className={`font-medium ${isTotal ? 'text-brand-dark' : ''}`}
                    >
                      {item.label}
                    </Label>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <Switch
                    id={item.key}
                    checked={isChecked}
                    onCheckedChange={() => toggleCostItem(item.key)}
                    disabled={isTotal} // Total is always shown
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Even if you hide certain cost items, they are still included
              in the total calculation. Hiding items only affects the display.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Manage how you receive updates about your bids, shipments, and account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label htmlFor="email-notif" className="font-medium">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch
                id="email-notif"
                checked={preferences?.notifications.email ?? true}
                onCheckedChange={() => toggleNotification('email')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label htmlFor="sms-notif" className="font-medium">SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive updates via text message</p>
              </div>
              <Switch
                id="sms-notif"
                checked={preferences?.notifications.sms ?? true}
                onCheckedChange={() => toggleNotification('sms')}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex-1">
                <Label htmlFor="push-notif" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-gray-500">Receive in-app notifications</p>
              </div>
              <Switch
                id="push-notif"
                checked={preferences?.notifications.push ?? true}
                onCheckedChange={() => toggleNotification('push')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="bg-brand-dark hover:bg-brand-dark/90"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
