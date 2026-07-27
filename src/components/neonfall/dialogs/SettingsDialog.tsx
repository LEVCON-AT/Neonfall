'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Vibrate,
  Activity,
  Zap,
  Lightbulb,
  Keyboard,
  Eye,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/store/settings-store';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Push a new value into one of the game IIFE's range sliders and dispatch an
 * `input` event so the IIFE's own listener (registered against #rattle-slider
 * and #impact-slider) picks up the change and updates its internal strength
 * variable. The IIFE listens for the standard `input` event (confirmed in the
 * GAME_SCRIPT source).
 */
function syncGameSlider(id: string, value01to2: number): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (!el) return;
  const pct = Math.round(value01to2 * 100);
  el.value = String(pct);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const KEYBINDS: { keys: string[]; action: string }[] = [
  { keys: ['←', '→'], action: 'Stein bewegen' },
  { keys: ['↓'], action: 'Stein absenken' },
  { keys: ['↑', 'X'], action: 'Drehung im Uhrzeigersinn' },
  { keys: ['Z'], action: 'Drehung gegen den Uhrzeigersinn' },
  { keys: ['Leertaste'], action: 'Sofort-Drop (Hard Drop)' },
  { keys: ['Shift', 'C'], action: 'Stein tauschen (Hold)' },
  { keys: ['P'], action: 'Pause' },
  { keys: ['M'], action: 'Ton an/aus' },
  { keys: ['I'], action: 'Hinweis öffnen' },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const s = useSettingsStore();

  // Whenever the dialog opens, push the persisted rattle/impact values into
  // the IIFE's sliders so the in-game behaviour matches the saved settings.
  useEffect(() => {
    if (!open) return;
    syncGameSlider('rattle-slider', s.rattleStrength);
    syncGameSlider('impact-slider', s.impactStrength);
    // Only re-sync when the dialog (re)opens — the per-slider onValueChange
    // handlers keep the IIFE in sync during live edits.
  }, [open, s.rattleStrength, s.impactStrength]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="nf-dialog-neon">
        <DialogHeader>
          <DialogTitle className="nf-dialog-title">Einstellungen</DialogTitle>
          <DialogDescription className="nf-dialog-desc">
            Passe Feedback, Anzeige und Steuerung an. Wird lokal gespeichert.
            NEONFALL ist ein Neon-Dark-Spiel — ein heller Modus ist nicht
            verfügbar.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="feedback" className="nf-settings-tabs">
          <TabsList className="nf-settings-tabslist">
            <TabsTrigger value="feedback">
              <Vibrate size={14} aria-hidden="true" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="display">
              <Lightbulb size={14} aria-hidden="true" /> Anzeige
            </TabsTrigger>
            <TabsTrigger value="controls">
              <Keyboard size={14} aria-hidden="true" /> Steuerung
            </TabsTrigger>
          </TabsList>

          {/* ===== Feedback ===== */}
          <TabsContent value="feedback" className="nf-tab-content">
            <div className="nf-setting-row">
              <Label htmlFor="set-rattle" className="nf-setting-label">
                <Activity size={14} aria-hidden="true" /> Ratterbewegung
              </Label>
              <div className="nf-setting-control">
                <Slider
                  id="set-rattle"
                  min={0}
                  max={200}
                  step={10}
                  value={[Math.round(s.rattleStrength * 100)]}
                  onValueChange={(v) => {
                    const val = v[0] / 100;
                    s.setRattle(val);
                    syncGameSlider('rattle-slider', val);
                  }}
                />
                <span className="nf-setting-value">
                  {Math.round(s.rattleStrength * 100)}%
                </span>
              </div>
            </div>
            <div className="nf-setting-row">
              <Label htmlFor="set-impact" className="nf-setting-label">
                <Zap size={14} aria-hidden="true" /> Aufprallstärke
              </Label>
              <div className="nf-setting-control">
                <Slider
                  id="set-impact"
                  min={0}
                  max={200}
                  step={10}
                  value={[Math.round(s.impactStrength * 100)]}
                  onValueChange={(v) => {
                    const val = v[0] / 100;
                    s.setImpact(val);
                    syncGameSlider('impact-slider', val);
                  }}
                />
                <span className="nf-setting-value">
                  {Math.round(s.impactStrength * 100)}%
                </span>
              </div>
            </div>
            <div className="nf-setting-row">
              <Label htmlFor="set-haptics" className="nf-setting-label">
                <Vibrate size={14} aria-hidden="true" /> Vibration (Haptik)
              </Label>
              <Switch
                id="set-haptics"
                checked={s.hapticsEnabled}
                onCheckedChange={() => s.toggleHaptics()}
              />
            </div>
            <p className="nf-setting-hint">
              Vibriert bei jedem Reihen-Clear — stärker bei Doppel-, Drilling-
              und Tetris-Clears. Nur auf mobilen Geräten mit Vibrations-SDK.
            </p>
          </TabsContent>

          {/* ===== Anzeige ===== */}
          <TabsContent value="display" className="nf-tab-content">
            <div className="nf-setting-row">
              <Label htmlFor="set-hint" className="nf-setting-label">
                <Lightbulb size={14} aria-hidden="true" /> Hinweis beim Start
              </Label>
              <Switch
                id="set-hint"
                checked={s.showHintOnStart}
                onCheckedChange={() => s.toggleHintOnStart()}
              />
            </div>
            <p className="nf-setting-hint">
              Zeigt das Steuerungs-Hinweis-Overlay beim nächsten Start an.
              Wird beim nächsten Laden wirksam.
            </p>
            <div className="nf-setting-row">
              <Label className="nf-setting-label">
                <Eye size={14} aria-hidden="true" /> Next-Vorschau
              </Label>
              <div className="nf-setting-control">
                <button
                  type="button"
                  className={`nf-preview-btn ${s.nextPreviewCount === 1 ? 'active' : ''}`}
                  onClick={() => s.setNextPreviewCount(1)}
                >1</button>
                <button
                  type="button"
                  className={`nf-preview-btn ${s.nextPreviewCount === 2 ? 'active' : ''}`}
                  onClick={() => s.setNextPreviewCount(2)}
                >2</button>
                <button
                  type="button"
                  className={`nf-preview-btn ${s.nextPreviewCount === 3 ? 'active' : ''}`}
                  onClick={() => s.setNextPreviewCount(3)}
                >3</button>
              </div>
            </div>
            <p className="nf-setting-hint">
              Anzahl der vorgeschauten Steine in der Next-Box.
            </p>
          </TabsContent>

          {/* ===== Steuerung ===== */}
          <TabsContent value="controls" className="nf-tab-content">
            <ul className="nf-keybind-list">
              {KEYBINDS.map((kb) => (
                <li key={kb.action} className="nf-keybind-row">
                  <span className="nf-keybind-keys">
                    {kb.keys.map((k) => (
                      <kbd key={k} className="nf-keybind-kbd">
                        {k}
                      </kbd>
                    ))}
                  </span>
                  <span className="nf-keybind-action">{kb.action}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="nf-settings-footer">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => s.reset()}
          >
            Zurücksetzen
          </Button>
          <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
            Fertig
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
