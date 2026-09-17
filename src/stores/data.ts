import { create } from 'zustand';
import type { Owner, Project, Task } from '@/db/types';
import { owners, projects, tasks } from '@/db/repos';

interface DataState {
  owners: Owner[];
  projects: Project[];
  tasks: Task[];
  loaded: boolean;
  refresh: () => void;
  reloadProjects: () => void;
  reloadTasks: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  owners: [],
  projects: [],
  tasks: [],
  loaded: false,
  refresh: () =>
    set({ owners: owners.listOwners(), projects: projects.listProjects(), tasks: tasks.listTasks(), loaded: true }),
  reloadProjects: () => set({ projects: projects.listProjects() }),
  reloadTasks: () => set({ tasks: tasks.listTasks() }),
}));
