import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { QuestForgeProject } from '../types/quest';
import { supabase, supabaseConfigured, PROJECT_TABLE, PROJECT_ROW_ID } from '../lib/supabase';

const STORAGE_KEY = 'questforge-project-v1';
const EMPTY_PROJECT: QuestForgeProject = { quests: [], actions: [], conditions: [], npcs: [] };

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline' | 'error';

function loadLocal(): QuestForgeProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as QuestForgeProject;
  } catch {
    // ignore malformed storage
  }
  return EMPTY_PROJECT;
}

interface ProjectContextValue {
  project: QuestForgeProject;
  setProject: (updater: (p: QuestForgeProject) => QuestForgeProject) => void;
  status: SyncStatus;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<QuestForgeProject>(loadLocal);
  const [status, setStatus] = useState<SyncStatus>(supabaseConfigured ? 'loading' : 'offline');
  const saveTimeout = useRef<number | undefined>(undefined);
  const skipNextRealtimeEcho = useRef(false);

  // Carga inicial + suscripción en tiempo real a Supabase
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;

    let active = true;

    async function init() {
      const { data, error } = await supabase!
        .from(PROJECT_TABLE)
        .select('data')
        .eq('id', PROJECT_ROW_ID)
        .single();

      if (!active) return;

      if (error) {
        console.error('Error cargando proyecto de Supabase:', error.message);
        setStatus('error');
        return;
      }
      if (data) setProjectState(data.data as QuestForgeProject);
      setStatus('synced');
    }

    init();

    const channel = supabase
      .channel('questforge-project-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: PROJECT_TABLE,
          filter: `id=eq.${PROJECT_ROW_ID}`,
        },
        (payload) => {
          if (skipNextRealtimeEcho.current) {
            skipNextRealtimeEcho.current = false;
            return;
          }
          setProjectState(payload.new.data as QuestForgeProject);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase!.removeChannel(channel);
    };
  }, []);

  function setProject(updater: (p: QuestForgeProject) => QuestForgeProject) {
    setProjectState((prev) => {
      const next = updater(prev);

      if (supabaseConfigured && supabase) {
        setStatus('saving');
        window.clearTimeout(saveTimeout.current);
        saveTimeout.current = window.setTimeout(async () => {
          skipNextRealtimeEcho.current = true;
          const { error } = await supabase!
            .from(PROJECT_TABLE)
            .update({ data: next, updated_at: new Date().toISOString() })
            .eq('id', PROJECT_ROW_ID);
          if (error) {
            console.error('Error guardando en Supabase:', error.message);
            setStatus('error');
          } else {
            setStatus('synced');
          }
        }, 600);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });
  }

  return (
    <ProjectContext.Provider value={{ project, setProject, status }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject debe usarse dentro de ProjectProvider');
  return ctx;
}
