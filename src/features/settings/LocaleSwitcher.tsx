import { useEffect } from 'react'
import { useStore } from 'zustand'
import type { LocaleKey } from '../../content/microcopy/id'
import { setLocale } from '../store/actions'
import { uiStore } from '../store/ui-store'
import { useMicrocopy } from '../form/useMicrocopy'

/**
 * Interface-language switcher (T3c, FR-701, ADR-0012).
 *
 * Same construction as `ModeToggle`: native radio inputs (free keyboard
 * arrows, focus retention, screen-reader semantics — no component library),
 * theme tokens only, nothing to animate. The switch writes the ui-store plus
 * a small localStorage preference through `setLocale()` and never touches
 * `ResumeDocument`. The page language is kept in sync so screen readers pick
 * the right pronunciation; the change is also announced through the
 * `role="status"` live region.
 */
export function LocaleSwitcher() {
  const pack = useMicrocopy()
  const locale = useStore(uiStore, (s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const options: Array<{ value: LocaleKey; label: string }> = [
    { value: 'id', label: pack.locale.indonesian },
    { value: 'en', label: pack.locale.english },
  ]
  const activeLabel = locale === 'id' ? pack.locale.indonesian : pack.locale.english

  return (
    <div>
      <fieldset className="border-0 p-0">
        <legend className="mb-1 text-xs font-medium">{pack.locale.label}</legend>
        <div className="inline-flex w-full border border-input sm:w-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex-1 cursor-pointer text-center sm:flex-none sm:px-6"
            >
              <input
                type="radio"
                name="cv-ui-locale"
                value={option.value}
                checked={locale === option.value}
                onChange={() => {
                  if (locale !== option.value) setLocale(option.value)
                }}
                className="peer sr-only"
              />
              <span className="block px-3 py-1.5 text-xs font-medium text-muted-foreground peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-1 peer-focus-visible:ring-ring peer-focus-visible:ring-inset">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p role="status" className="sr-only">
        {pack.locale.status.replace('{locale}', activeLabel)}
      </p>
    </div>
  )
}
