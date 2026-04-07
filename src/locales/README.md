# Localization System

This directory contains translation files for the Sonor game application.

## Supported Languages

- **Russian (ru)** - Русский
- **English (en)** - English
- **Yakut (sah)** - Саха тыла

## File Structure

```
src/locales/
├── ru.json   # Russian translations
├── en.json   # English translations
└── sah.json  # Yakut translations
```

## Usage

### In React Components

Use the `useTranslation` hook:

```tsx
import { useTranslation } from '../hooks/useTranslation';

function MyComponent() {
  const t = useTranslation();
  
  return <h1>{t('app.title')}</h1>;
}
```

### In Non-React Code (Stores, Utils)

Use the `translate` utility function:

```typescript
import { t } from '../utils/i18n';

console.warn(t('errors.invalidMove'));
```

### Changing Language

Use the `useLocale` hook:

```tsx
import { useLocale } from '../contexts/LocaleContext';

function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  
  return (
    <button onClick={() => setLocale('en')}>
      Switch to English
    </button>
  );
}
```

## Translation Keys

Translation keys use dot notation to access nested values:

- `app.title` → "Сонор" / "Sonor" / "Сонор"
- `gameMode.singlePlayer` → "Одиночная игра" / "Single Player" / "Биир киһи оонньуур"
- `errors.invalidMove` → "Неверный ход" / "Invalid move" / "Сыыһа ход"

## Adding New Translations

1. Add the key-value pair to all three language files
2. Use the same key structure across all files
3. Test in all languages to ensure proper display

## Persistence

The selected language is automatically saved to `localStorage` with the key `sonor-locale` and persists across sessions.
