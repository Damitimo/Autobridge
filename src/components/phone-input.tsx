'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  defaultCountry?: string;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
  required = false,
  disabled = false,
  className = '',
  defaultCountry = 'NG',
}: PhoneInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = useState('');

  // Parse initial value to extract country code and number
  useEffect(() => {
    if (value) {
      // Check if value starts with a dial code
      const matchingCountry = COUNTRIES.find(c => value.startsWith(c.dialCode));
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneNumber(value.substring(matchingCountry.dialCode.length).trim());
      } else {
        // No dial code, just set the number
        setPhoneNumber(value.replace(/^\+?\d{1,3}\s?/, ''));
      }
    }
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    // Update the full value
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber) {
      onChange(`${country.dialCode}${cleanNumber}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numbers
    const cleanNumber = inputValue.replace(/\D/g, '');
    setPhoneNumber(cleanNumber);
    // Combine with country code
    if (cleanNumber) {
      onChange(`${selectedCountry.dialCode}${cleanNumber}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative flex ${className}`}>
      {/* Country Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="flex items-center gap-1 px-3 h-full border border-r-0 rounded-l-md bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px]"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-md shadow-lg z-20 max-h-60 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 text-left ${
                    selectedCountry.code === country.code ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 text-sm">{country.name}</span>
                  <span className="text-sm text-gray-500">{country.dialCode}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Phone Number Input */}
      <Input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="rounded-l-none flex-1"
      />
    </div>
  );
}
