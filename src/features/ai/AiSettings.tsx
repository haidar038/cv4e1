'use no memo'
/**
 * Opted out of React Compiler memoization (Task 18 incident): with the
 * compiler enabled, the save handlers below observed permanently stale
 * input state in the production build — typing updated state (proven by
 * render output) yet the save closure read the initial value, so keys were
 * silently never stored. Unit/jsdom tests cannot catch this class of bug
 * (vitest does not run the compiler); the e2e spec on the production build
 * is the regression gate. Revisit if the compiler is upgraded or the
 * upstream miscompile is fixed.
 */
import { useState } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GROQ_DEFAULT_MODEL } from '../../ai'
import { normalizeProviderBaseUrl } from '../../ai'
import { useMicrocopy } from '../form/useMicrocopy'
import { ConsentDialog } from './ConsentDialog'
import { consentStore } from './consent-store'
import type { AiProviderId } from './consent-store'
import {
  clearSessionCredentials,
  hasSessionCredentials,
  setSessionCredentials,
} from './session-keys'

const GROQ_POLICY_URL = 'https://groq.com/privacy-policy'

interface ReviewTarget {
  readonly id: AiProviderId
  readonly name: string
  readonly policyUrl?: string
}

/**
 * BYO-key settings (Task 18, FR-402/407/408, FR-110, ADR-0006 Opsi 4).
 *
 * Mounted beside DataManagement in the DraftPanel: keys are data-session
 * configuration, so they live with the other data actions. Everything here
 * is memory-only — saving writes the tab-local vault, clearing forgets, and
 * reloading the tab returns every provider to the unconfigured FR-408 state.
 * The "review consent" buttons open the same gate Task 19 will use before a
 * first send; granting here pre-approves the session, declining sends
 * nothing. Mounted outside `#cv-preview` like DataManagement.
 */
export function AiSettings() {
  const pack = useMicrocopy()
  const grants = useStore(consentStore, (s) => s.grants)
  const [groqKey, setGroqKey] = useState('')
  const [groqModel, setGroqModel] = useState(GROQ_DEFAULT_MODEL)
  const [endpoint, setEndpoint] = useState('')
  const [oaiKey, setOaiKey] = useState('')
  const [oaiModel, setOaiModel] = useState('')
  const [endpointError, setEndpointError] = useState(false)
  const [incomplete, setIncomplete] = useState(false)
  const [review, setReview] = useState<ReviewTarget | null>(null)
  // Vault reads are module-state snapshots; bump to re-render after save/clear.
  const [, setSnapshot] = useState(0)

  const groqConfigured = hasSessionCredentials('groq')
  const oaiConfigured = hasSessionCredentials('openai-compatible')

  const saveGroq = (): void => {
    if (groqKey.trim() === '') return
    setSessionCredentials('groq', {
      apiKey: groqKey.trim(),
      model: groqModel.trim() === '' ? GROQ_DEFAULT_MODEL : groqModel.trim(),
    })
    setGroqKey('')
    setSnapshot((n) => n + 1)
  }

  const saveCompatible = (): void => {
    const validated = normalizeProviderBaseUrl(endpoint)
    if (!validated.ok || oaiKey.trim() === '' || oaiModel.trim() === '') {
      setEndpointError(!validated.ok)
      setIncomplete(validated.ok && (oaiKey.trim() === '' || oaiModel.trim() === ''))
      return
    }
    setEndpointError(false)
    setIncomplete(false)
    setSessionCredentials('openai-compatible', {
      apiKey: oaiKey.trim(),
      model: oaiModel.trim(),
      baseUrl: validated.url,
    })
    setOaiKey('')
    setSnapshot((n) => n + 1)
  }

  const clearProvider = (id: AiProviderId): void => {
    clearSessionCredentials(id)
    consentStore.getState().revoke(id)
    setSnapshot((n) => n + 1)
  }

  return (
    <section aria-label={pack.aiKeys.sectionTitle} className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-medium">{pack.aiKeys.sectionTitle}</h2>
      <p className="text-sm text-muted-foreground">{pack.aiKeys.intro}</p>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Groq</h3>
        <label htmlFor="ai-groq-key" className="text-sm">
          {pack.aiKeys.apiKeyLabel}
        </label>
        <Input
          id="ai-groq-key"
          type="password"
          autoComplete="off"
          placeholder={pack.aiKeys.keyPlaceholder}
          value={groqKey}
          onChange={(event) => setGroqKey(event.target.value)}
        />
        <label htmlFor="ai-groq-model" className="text-sm">
          {pack.aiKeys.modelLabel}
        </label>
        <Input
          id="ai-groq-model"
          value={groqModel}
          onChange={(event) => setGroqModel(event.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={saveGroq}>
            {pack.aiKeys.saveAction}
          </Button>
          {groqConfigured && (
            <Button type="button" size="sm" variant="outline" onClick={() => clearProvider('groq')}>
              {pack.aiKeys.clearAction}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`${pack.aiKeys.reviewConsent} (Groq)`}
            onClick={() => setReview({ id: 'groq', name: 'Groq', policyUrl: GROQ_POLICY_URL })}
          >
            {pack.aiKeys.reviewConsent}
          </Button>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {groqConfigured ? pack.aiKeys.configuredStatus : pack.aiKeys.unconfiguredReason}
        </p>
        {grants['groq'] === true && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">{pack.aiKeys.grantedNote}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => consentStore.getState().revoke('groq')}
            >
              {pack.aiKeys.revokeConsent}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">OpenAI-compatible</h3>
        <label htmlFor="ai-oai-endpoint" className="text-sm">
          {pack.aiKeys.endpointLabel}
        </label>
        <Input
          id="ai-oai-endpoint"
          inputMode="url"
          autoComplete="off"
          placeholder="https://"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
        />
        <label htmlFor="ai-oai-key" className="text-sm">
          {pack.aiKeys.apiKeyLabel}
        </label>
        <Input
          id="ai-oai-key"
          type="password"
          autoComplete="off"
          placeholder={pack.aiKeys.keyPlaceholder}
          value={oaiKey}
          onChange={(event) => setOaiKey(event.target.value)}
        />
        <label htmlFor="ai-oai-model" className="text-sm">
          {pack.aiKeys.modelLabel}
        </label>
        <Input
          id="ai-oai-model"
          autoComplete="off"
          value={oaiModel}
          onChange={(event) => setOaiModel(event.target.value)}
        />
        {endpointError && (
          <p role="alert" className="text-sm text-destructive">
            {pack.aiKeys.endpointInvalid}
          </p>
        )}
        {incomplete && (
          <p role="alert" className="text-sm text-destructive">
            {pack.aiKeys.incompleteNote}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={saveCompatible}>
            {pack.aiKeys.saveAction}
          </Button>
          {oaiConfigured && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => clearProvider('openai-compatible')}
            >
              {pack.aiKeys.clearAction}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`${pack.aiKeys.reviewConsent} (OpenAI-compatible)`}
            onClick={() => setReview({ id: 'openai-compatible', name: 'OpenAI-compatible' })}
          >
            {pack.aiKeys.reviewConsent}
          </Button>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {oaiConfigured ? pack.aiKeys.configuredStatus : pack.aiKeys.unconfiguredReason}
        </p>
        {grants['openai-compatible'] === true && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">{pack.aiKeys.grantedNote}</p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => consentStore.getState().revoke('openai-compatible')}
            >
              {pack.aiKeys.revokeConsent}
            </Button>
          </div>
        )}
      </div>

      <ConsentDialog
        open={review !== null}
        request={{
          providerName: review?.name ?? '',
          dataFields: [pack.aiConsent.dataFieldsList],
          ...(review?.policyUrl !== undefined ? { policyUrl: review.policyUrl } : {}),
        }}
        onGrant={() => {
          if (review !== null) consentStore.getState().grant(review.id)
          setReview(null)
        }}
        onDecline={() => setReview(null)}
      />
    </section>
  )
}
