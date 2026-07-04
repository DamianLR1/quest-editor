import { useMemo, useState } from 'react';
import { useProject } from '../state/ProjectContext';
import { questsToYaml, actionsToYaml, conditionsToYaml } from '../lib/yamlExport';
import { yamlToQuests, yamlToActions, yamlToConditions } from '../lib/yamlImport';
import { Button, Section, EmptyState } from '../components/ui';

type FileKind = 'quests' | 'actions' | 'conditions';

const FILE_LABEL: Record<FileKind, string> = {
  quests: 'quests.yml',
  actions: 'actions.yml',
  conditions: 'conditions.yml',
};

export function ExportPanel() {
  const { project, setProject } = useProject();
  const [tab, setTab] = useState<FileKind>('quests');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importOk, setImportOk] = useState<string | null>(null);

  const yamlText = useMemo(() => {
    try {
      if (tab === 'quests') return questsToYaml(project.quests);
      if (tab === 'actions') return actionsToYaml(project.actions);
      return conditionsToYaml(project.conditions);
    } catch (e) {
      return `# Error generando YAML: ${(e as Error).message}`;
    }
  }, [tab, project]);

  function copyToClipboard() {
    navigator.clipboard.writeText(yamlText);
  }

  function download() {
    const blob = new Blob([yamlText], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILE_LABEL[tab];
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(mode: 'replace' | 'merge') {
    setImportError(null);
    setImportOk(null);
    try {
      if (tab === 'quests') {
        const parsed = yamlToQuests(importText);
        setProject((p) => ({
          ...p,
          quests: mode === 'replace' ? parsed : [...p.quests, ...parsed],
        }));
        setImportOk(`Importadas ${parsed.length} quests.`);
      } else if (tab === 'actions') {
        const parsed = yamlToActions(importText);
        setProject((p) => ({
          ...p,
          actions: mode === 'replace' ? parsed : [...p.actions, ...parsed],
        }));
        setImportOk(`Importadas ${parsed.length} actions.`);
      } else {
        const parsed = yamlToConditions(importText);
        setProject((p) => ({
          ...p,
          conditions: mode === 'replace' ? parsed : [...p.conditions, ...parsed],
        }));
        setImportOk(`Importadas ${parsed.length} conditions.`);
      }
      setImportText('');
    } catch (e) {
      setImportError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['quests', 'actions', 'conditions'] as FileKind[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors ${
              tab === k
                ? 'bg-copper text-void'
                : 'bg-panel-raised text-ink-dim border border-line hover:text-ink'
            }`}
          >
            {FILE_LABEL[k]}
          </button>
        ))}
      </div>

      <Section title={`Preview — ${FILE_LABEL[tab]}`} defaultOpen>
        <div className="flex gap-2 mb-3">
          <Button variant="primary" onClick={copyToClipboard}>
            Copiar al portapapeles
          </Button>
          <Button variant="default" onClick={download}>
            Descargar {FILE_LABEL[tab]}
          </Button>
        </div>
        {yamlText.trim() === '' || yamlText.includes('{}') ? (
          <EmptyState message={`Todavía no hay contenido en ${FILE_LABEL[tab]}.`} />
        ) : (
          <pre className="bg-void border border-line rounded-lg p-4 text-xs font-mono text-ink-dim overflow-auto max-h-[480px] whitespace-pre-wrap">
            {yamlText}
          </pre>
        )}
      </Section>

      <Section title={`Importar — pegar ${FILE_LABEL[tab]} existente`} defaultOpen={false}>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`Pegá acá el contenido de tu ${FILE_LABEL[tab]}...`}
          rows={10}
          className="w-full font-mono text-xs"
        />
        <div className="flex gap-2 mt-2">
          <Button variant="primary" onClick={() => handleImport('merge')} disabled={!importText.trim()}>
            Agregar a lo existente
          </Button>
          <Button variant="danger" onClick={() => handleImport('replace')} disabled={!importText.trim()}>
            Reemplazar todo
          </Button>
        </div>
        {importError && (
          <p className="text-redstone text-xs mt-2 font-mono">Error: {importError}</p>
        )}
        {importOk && <p className="text-emerald text-xs mt-2">{importOk}</p>}
      </Section>
    </div>
  );
}
