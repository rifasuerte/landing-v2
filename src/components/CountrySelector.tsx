'use client';

import { useState } from 'react';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Función para obtener el emoji de bandera usando códigos Unicode
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const countries: Country[] = [
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: getFlagEmoji('VE') },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: getFlagEmoji('CO') },
  { code: 'MX', name: 'México', dialCode: '+52', flag: getFlagEmoji('MX') },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: getFlagEmoji('AR') },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: getFlagEmoji('CL') },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: getFlagEmoji('PE') },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: getFlagEmoji('EC') },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: getFlagEmoji('BO') },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: getFlagEmoji('PY') },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: getFlagEmoji('UY') },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: getFlagEmoji('BR') },
  { code: 'PA', name: 'Panamá', dialCode: '+507', flag: getFlagEmoji('PA') },
  { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: getFlagEmoji('CR') },
  { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: getFlagEmoji('GT') },
  { code: 'HN', name: 'Honduras', dialCode: '+504', flag: getFlagEmoji('HN') },
  { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: getFlagEmoji('NI') },
  { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: getFlagEmoji('SV') },
  { code: 'DO', name: 'República Dominicana', dialCode: '+1', flag: getFlagEmoji('DO') },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: getFlagEmoji('CU') },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: getFlagEmoji('US') },
  { code: 'ES', name: 'España', dialCode: '+34', flag: getFlagEmoji('ES') },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: getFlagEmoji('IT') },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: getFlagEmoji('FR') },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: getFlagEmoji('DE') },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: getFlagEmoji('GB') },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: getFlagEmoji('CA') },
];

interface CountrySelectorProps {
  value: string;
  onChange: (dialCode: string) => void;
  darkMode?: boolean;
}

export default function CountrySelector({ value, onChange, darkMode = false }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCountry = countries.find(c => c.dialCode === value) || countries[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2.5 border rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0 ${
          darkMode
            ? 'border-gray-700 bg-gray-800 hover:border-gray-600 text-white'
            : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <span className={`text-sm font-medium whitespace-nowrap ${
          darkMode ? 'text-white' : 'text-gray-700'
        }`}>{selectedCountry.dialCode}</span>
        <svg className={`w-4 h-4 flex-shrink-0 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute top-full left-0 mt-1 w-64 border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto ${
            darkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-300'
          }`}>
            {countries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.dialCode);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-700 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>{country.name}</p>
                  <p className={`text-xs ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>{country.dialCode}</p>
                </div>
                {selectedCountry.code === country.code && (
                  <svg className={`w-5 h-5 ${
                    darkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

