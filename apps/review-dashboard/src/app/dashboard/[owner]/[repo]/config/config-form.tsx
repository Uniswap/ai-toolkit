'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

interface RepoConfig {
  model: string;
  maxDiffLines: number;
  fileExclusions: string;
}

interface OverridableSection {
  key: string;
  label: string;
}

interface ConfigFormProps {
  owner: string;
  repo: string;
  config: RepoConfig;
  overrides: Record<string, string>;
  overridableSections: OverridableSection[];
}

const AVAILABLE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'claude-haiku-3-20250422',
];

export function ConfigForm({
  owner,
  repo,
  config,
  overrides,
  overridableSections,
}: ConfigFormProps) {
  const [model, setModel] = useState(config.model);
  const [maxDiffLines, setMaxDiffLines] = useState(config.maxDiffLines);
  const [fileExclusions, setFileExclusions] = useState(config.fileExclusions);
  const [promptOverrides, setPromptOverrides] = useState<Record<string, string>>(overrides);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  function updateOverride(key: string, content: string) {
    setPromptOverrides((prev) => ({
      ...prev,
      [key]: content,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/repos/${owner}/${repo}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            model,
            maxDiffLines,
            fileExclusions,
          },
          overrides: Object.entries(promptOverrides)
            .filter(([, content]) => content.trim().length > 0)
            .map(([sectionKey, content]) => ({
              sectionKey,
              content,
            })),
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Failed to save configuration');
      }

      setMessage({ type: 'success', text: 'Configuration saved successfully.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save configuration',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* General Configuration */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          General Settings
        </h2>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="model">Model</label>
          <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
            {AVAILABLE_MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="maxDiffLines">Max Diff Lines</label>
          <input
            id="maxDiffLines"
            type="number"
            min={100}
            max={50000}
            value={maxDiffLines}
            onChange={(e) => setMaxDiffLines(Number(e.target.value))}
          />
          <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            Maximum number of diff lines to include in the review prompt.
          </p>
        </div>

        <div>
          <label htmlFor="fileExclusions">File Exclusion Patterns</label>
          <textarea
            id="fileExclusions"
            rows={4}
            value={fileExclusions}
            onChange={(e) => setFileExclusions(e.target.value)}
            placeholder="package-lock.json&#10;*.min.js&#10;dist/**"
          />
          <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            One glob pattern per line. Matching files will be excluded from reviews.
          </p>
        </div>
      </div>

      {/* Prompt Overrides */}
      <div className="card">
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Prompt Overrides
        </h2>
        <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Override specific sections of the review prompt. Leave empty to use defaults.
        </p>

        {overridableSections.map((section) => (
          <div
            key={section.key}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              marginBottom: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'inherit',
              }}
            >
              <span>{section.label}</span>
              <span style={{ color: '#999' }}>
                {expandedSections[section.key] ? '\u25B2' : '\u25BC'}
              </span>
            </button>
            {expandedSections[section.key] && (
              <div style={{ padding: '0 1rem 1rem' }}>
                <textarea
                  rows={8}
                  value={promptOverrides[section.key] ?? ''}
                  onChange={(e) => updateOverride(section.key, e.target.value)}
                  placeholder={`Custom ${section.label.toLowerCase()} content...`}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        {message && (
          <span
            style={{
              fontSize: '0.875rem',
              color: message.type === 'success' ? '#155724' : '#721c24',
            }}
          >
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
}
