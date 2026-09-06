"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Navigation,
  X,
} from "lucide-react";
import { GeoRulesInput } from "@/components/geo-rules-input";
import { useShortenForm, type SlugStatus } from "@/hooks/use-shorten-form";
import { toDateTimeLocalValue } from "@/lib/datetime";

const SLUG_INDICATOR: Record<SlugStatus, React.ReactNode> = {
  checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
  available: <Check className="h-4 w-4 text-success" />,
  taken:     <X className="h-4 w-4 text-destructive" />,
  invalid:   <AlertCircle className="h-4 w-4 text-destructive" />,
  idle:      null,
};

const SLUG_HINT: Record<SlugStatus, { text: string; cls: string } | null> = {
  available: { text: "Available!",                            cls: "text-success" },
  taken:     { text: "Already taken",                         cls: "text-destructive" },
  invalid:   { text: "Letters, numbers, - or _ (2–50 chars)", cls: "text-destructive" },
  checking:  null,
  idle:      null,
};

export function ShortenForm({ appUrl }: { appUrl: string }) {
  const { state, dispatch, isPending, appDomain, shortUrl, handleSubmit, handleCopy } =
    useShortenForm(appUrl);

  const { url, customSlug, expiresAt, password, showPassword, geoRules, slugStatus, result, copied, showAdvanced } =
    state;

  return (
    <form onSubmit={handleSubmit} className="dispatch-form">
      <section className="destination-band" aria-labelledby="destination-label">
        <div className="destination-band__label-line">
          <Label id="destination-label" htmlFor="url">Destination URL</Label>
          <span className="destination-band__route" aria-hidden="true" />
          <Navigation className="destination-band__plane" aria-hidden="true" />
        </div>

        <div className="destination-band__controls">
          <div className="destination-band__input-wrap">
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/a/very/long/path"
              value={url}
              onChange={(e) => dispatch({ type: "PATCH", payload: { url: e.target.value } })}
              required
              disabled={isPending}
              className="destination-band__input"
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || slugStatus === "taken" || slugStatus === "invalid"}
            className="destination-band__submit"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Shortening
              </>
            ) : (
              <>
                Shorten link
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
        <span className="destination-band__barcode destination-band__barcode--left" aria-hidden="true" />
        <span className="destination-band__barcode destination-band__barcode--right" aria-hidden="true" />
      </section>

      <div className="dispatch-lower">
        <section className="options-ticket">
          <button
            type="button"
            onClick={() => dispatch({ type: "PATCH", payload: { showAdvanced: !showAdvanced } })}
            className="options-ticket__toggle"
            aria-expanded={showAdvanced}
            aria-controls="link-options-panel"
          >
            <span>Link options</span>
            {showAdvanced ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
          </button>

          <div id="link-options-panel" className="options-ticket__body" data-open={showAdvanced}>
            {!showAdvanced ? (
              <div className="options-ticket__summary" aria-hidden="true">
                {[
                  "Custom alias",
                  "Password",
                  "Expiration",
                  "Geographic redirects",
                ].map((label) => (
                  <div className="option-summary-row" key={label}>
                    <span>{label}</span>
                    <span className="option-summary-row__mark" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="options-ticket__fields">
                <div className="option-field">
                  <Label htmlFor="slug">Custom alias</Label>
                  <div className="alias-control">
                    <span>{appDomain}/</span>
                    <input
                      id="slug"
                      placeholder="my-link"
                      value={customSlug}
                      onChange={(e) => dispatch({ type: "PATCH", payload: { customSlug: e.target.value } })}
                      disabled={isPending}
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                      spellCheck={false}
                    />
                    {SLUG_INDICATOR[slugStatus] && (
                      <span className="alias-control__status">{SLUG_INDICATOR[slugStatus]}</span>
                    )}
                  </div>
                  {SLUG_HINT[slugStatus] && (
                    <p className={`option-field__hint ${SLUG_HINT[slugStatus]!.cls}`} role="status">
                      {SLUG_HINT[slugStatus]!.text}
                    </p>
                  )}
                </div>

                <div className="option-field">
                  <Label htmlFor="password">
                    Password <span>(optional)</span>
                  </Label>
                  <div className="password-control">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Leave blank for public access"
                      value={password}
                      onChange={(e) => dispatch({ type: "PATCH", payload: { password: e.target.value } })}
                      disabled={isPending}
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "PATCH", payload: { showPassword: !showPassword } })}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="option-field">
                  <Label htmlFor="expires">
                    Expiration <span>(optional)</span>
                  </Label>
                  <Input
                    id="expires"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => dispatch({ type: "PATCH", payload: { expiresAt: e.target.value } })}
                    min={toDateTimeLocalValue(new Date(Date.now() + 60_000))}
                    disabled={isPending}
                  />
                </div>

                <div className="option-field option-field--geo">
                  <GeoRulesInput
                    rules={geoRules}
                    onChange={(rules) => dispatch({ type: "PATCH", payload: { geoRules: rules } })}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="dispatch-perforation" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => <span key={index} />)}
        </div>

        <section
          className="result-ticket"
          data-state={result ? "ready" : "empty"}
          aria-live="polite"
        >
          <span className="result-ticket__line result-ticket__line--one" aria-hidden="true" />
          <span className="result-ticket__line result-ticket__line--two" aria-hidden="true" />
          {result && (
            <div data-testid="shorten-result" className="result-ticket__content">
              <span className="result-ticket__url">{shortUrl}</span>
              <Button
                type="button"
                onClick={handleCopy}
                className="result-ticket__copy"
                aria-label={copied ? "Short link copied" : "Copy short link"}
              >
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </form>
  );
}
