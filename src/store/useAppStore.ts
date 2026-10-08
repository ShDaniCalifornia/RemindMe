import { addDays, dateKey } from "@/shared/utils/date";
import type { Priority } from "@/shared/utils/tasks";
import type { BackgroundId } from "@/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Mood = "calm" | "tired" | "anxious" | "happy" | "low";

export type HabitKind = "good" | "bad";

export type ThemePref = "system" | "light" | "dark";

export type DarkBackgroundId =
  | "graphite"
  | "coffee"
  | "forest"
  | "navy"
  | "plum";

export type TaskCategory = "work" | "personal" | "health";

export const CATEGORIES: {
  id: TaskCategory;
  label: string;
}[] = [
  {
    id: "work",
    label: "Работа",
  },
  {
    id: "personal",
    label: "Личное",
  },
  {
    id: "health",
    label: "Здоровье",
  },
];

export const MOOD_LABELS: Record<Mood, string> = {
  calm: "Спокойно",
  tired: "Нет сил",
  anxious: "Тревожно",
  happy: "Счастливо",
  low: "Не очень",
};

export type MediaBlock = {
  id: string;
  uri: string;
  caption?: string;
};

export type Album = {
  id: string;
  title: string;
  description?: string;
  color?: string;
  coverUri?: string;
  images: MediaBlock[];
  createdAt: string;
};

export type Habit = {
  id: string;
  title: string;
  unit: string;
  goal: number;
  kind: HabitKind;
  log: Record<string, number>;
};

export type Task = {
  id: string;
  title: string;
  note?: string;
  date: string;
  category: TaskCategory;
  done: boolean;
  priority?: Priority;
  time?: string;
  timer?: "pomodoro" | number;
  albumIds?: string[];
  images?: MediaBlock[];
};

export type FocusSession = {
  id: string;
  title: string;
  taskId?: string;
  minutes: number;
  endedAt: string;
};

export type Note = {
  id: string;
  kind: "note" | "diary";
  title: string;
  text: string;
  html?: string;
  mood: Mood | null;
  createdAt: string;
  images?: MediaBlock[];
  albumIds?: string[];
};

export type MoodEntry = {
  id: string;
  mood: Mood;
  note?: string;
  tags?: string[];
  at: string;
};

export type Folder = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type TodoStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
  bg?: string;
};

export type Todo = {
  id: string;
  folderId: string;
  text: string;
  done: boolean;
  heading?: boolean;
  style?: TodoStyle;
  detailsHtml?: string;
  albumIds?: string[];
  images?: MediaBlock[];
};

type Data = {
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
  moodLog: Record<string, Mood>;
  focusSessions: FocusSession[];
  moodEntries: MoodEntry[];
  folders: Folder[];
  todos: Todo[];
  albums: Album[];
  customColors: string[];
};

type Settings = {
  themePref: ThemePref;
  backgroundPref: BackgroundId;
  darkBackgroundPref: DarkBackgroundId;
  name: string;
  notifications: boolean;
};

type AlbumCreateInput = Omit<Album, "id" | "createdAt">;

type AlbumUpdateInput = Partial<
  Pick<Album, "title" | "description" | "color" | "coverUri" | "images">
>;

type Actions = {
  setMood: (m: Mood) => void;

  addHabit: (h: Omit<Habit, "id" | "log">) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id" | "log">>) => void;
  removeHabit: (id: string) => void;
  bumpHabit: (id: string, delta: number) => void;

  addTask: (t: Omit<Task, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;

  addNote: (n: Omit<Note, "id" | "createdAt">) => void;
  updateNote: (
    id: string,
    patch: Partial<Omit<Note, "id" | "createdAt">>,
  ) => void;
  removeNote: (id: string) => void;

  addFocusSession: (s: {
    title: string;
    taskId?: string;
    minutes: number;
  }) => void;

  addMoodEntry: (m: { mood: Mood; note?: string; tags?: string[] }) => string;

  updateMoodEntry: (
    id: string,
    patch: {
      note?: string;
      tags?: string[];
    },
  ) => void;

  addFolder: (name: string, color: string) => string;

  updateFolder: (
    id: string,
    patch: Partial<Pick<Folder, "name" | "color">>,
  ) => void;

  removeFolder: (id: string) => void;

  addAlbum: (album: AlbumCreateInput) => string;

  updateAlbum: (id: string, patch: AlbumUpdateInput) => void;

  addAlbumImage: (id: string, image: MediaBlock) => void;

  removeAlbumImage: (id: string, imageId: string) => void;

  reorderAlbumImages: (id: string, orderedIds: string[]) => void;

  reorderAlbums: (orderedIds: string[]) => void;

  removeAlbum: (id: string) => void;

  addTodo: (
    folderId: string,
    text: string,
    extra?: {
      heading?: boolean;
      style?: TodoStyle;
      detailsHtml?: string;
      images?: MediaBlock[];
      albumIds?: string[];
    },
  ) => string;

  updateTodo: (id: string, patch: Partial<Omit<Todo, "id">>) => void;

  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;

  reorderTodos: (folderId: string, orderedIds: string[]) => void;

  clearDoneTodos: (folderId: string) => void;

  addCustomColor: (hex: string) => void;
  removeCustomColor: (hex: string) => void;

  setThemePref: (t: ThemePref) => void;
  setBackground: (b: BackgroundId) => void;
  setDarkBackground: (darkBackgroundPref: DarkBackgroundId) => void;

  setName: (n: string) => void;
  setNotifications: (v: boolean) => void;

  resetData: () => void;
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const seed = (): Data => ({
  habits: [
    {
      id: "water",
      title: "Вода",
      unit: "стаканов",
      goal: 6,
      kind: "good",
      log: {},
    },
    {
      id: "walk",
      title: "Прогулка",
      unit: "раз",
      goal: 1,
      kind: "good",
      log: {},
    },
    {
      id: "meds",
      title: "Лекарства",
      unit: "раз",
      goal: 1,
      kind: "good",
      log: {},
    },
    {
      id: "sleep",
      title: "Сон 7–8 часов",
      unit: "раз",
      goal: 1,
      kind: "good",
      log: {},
    },
    {
      id: "coffee",
      title: "Кофе",
      unit: "чашки",
      goal: 2,
      kind: "bad",
      log: {},
    },
  ],

  tasks: [
    {
      id: "t1",
      title: "Выпить воды",
      note: "3 раза в день",
      date: dateKey(),
      category: "health",
      done: false,
    },
    {
      id: "t2",
      title: "Прогулка",
      note: "20 минут",
      date: dateKey(),
      category: "personal",
      done: false,
    },
    {
      id: "t3",
      title: "Йога",
      note: "15 минут",
      date: dateKey(addDays(new Date(), 1)),
      category: "health",
      done: false,
    },
  ],

  notes: [],
  moodLog: {},
  focusSessions: [],
  moodEntries: [],

  folders: [
    {
      id: "inbox",
      name: "Входящие",
      color: "#6B8A6E",
      createdAt: new Date().toISOString(),
    },
  ],

  todos: [],
  customColors: [],
  albums: [],
});

export const useAppStore = create<Data & Settings & Actions>()(
  persist(
    (set) => ({
      ...seed(),

      themePref: "system",
      backgroundPref: "beige",
      darkBackgroundPref: "graphite",
      name: "",
      notifications: true,

      setMood: (m) =>
        set((s) => ({
          moodLog: {
            ...s.moodLog,
            [dateKey()]: m,
          },
        })),

      addHabit: (h) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              ...h,
              id: uid(),
              log: {},
            },
          ],
        })),

      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? {
                  ...h,
                  ...patch,
                }
              : h,
          ),
        })),

      removeHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
        })),

      bumpHabit: (id, delta) =>
        set((state) => {
          const today = dateKey();

          return {
            habits: state.habits.map((habit) => {
              if (habit.id !== id) {
                return habit;
              }

              const current = Number(habit.log?.[today] ?? 0);
              const goal = Math.max(0, Number(habit.goal) || 0);

              const next = Math.max(0, Math.min(goal, current + delta));

              return {
                ...habit,
                log: {
                  ...habit.log,
                  [today]: next,
                },
              };
            }),
          };
        }),

      addTask: (t) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...t,
              id: uid(),
              done: false,
            },
          ],
        })),

      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                }
              : t,
          ),
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),

      addNote: (n) =>
        set((s) => ({
          notes: [
            {
              ...n,
              id: uid(),
              createdAt: new Date().toISOString(),
            },
            ...s.notes,
          ],
        })),

      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...patch,
                }
              : n,
          ),
        })),

      removeNote: (id) =>
        set((s) => ({
          notes: s.notes.filter((n) => n.id !== id),
        })),

      addFocusSession: (f) =>
        set((s) => ({
          focusSessions: [
            ...s.focusSessions,
            {
              ...f,
              id: uid(),
              endedAt: new Date().toISOString(),
            },
          ],
        })),

      addMoodEntry: (m) => {
        const id = uid();
        const at = new Date();

        set((s) => ({
          moodEntries: [
            ...s.moodEntries,
            {
              id,
              mood: m.mood,
              note: m.note,
              tags: m.tags,
              at: at.toISOString(),
            },
          ],

          moodLog: {
            ...s.moodLog,
            [dateKey(at)]: m.mood,
          },
        }));

        return id;
      },

      updateMoodEntry: (id, patch) =>
        set((s) => ({
          moodEntries: s.moodEntries.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  ...patch,
                }
              : entry,
          ),
        })),

      addFolder: (name, color) => {
        const id = uid();

        set((s) => ({
          folders: [
            ...s.folders,
            {
              id,
              name,
              color,
              createdAt: new Date().toISOString(),
            },
          ],
        }));

        return id;
      },

      updateFolder: (id, patch) =>
        set((s) => ({
          folders: s.folders.map((folder) =>
            folder.id === id
              ? {
                  ...folder,
                  ...patch,
                }
              : folder,
          ),
        })),

      removeFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((folder) => folder.id !== id),
          todos: s.todos.filter((todo) => todo.folderId !== id),
        })),

      addAlbum: (album) => {
        const id = uid();

        set((s) => ({
          albums: [
            ...s.albums,
            {
              ...album,
              id,
              title: album.title.trim() || "Без названия",
              description: album.description?.trim() || "",
              createdAt: new Date().toISOString(),
            },
          ],
        }));

        return id;
      },

      updateAlbum: (id, patch) =>
        set((s) => ({
          albums: s.albums.map((album) =>
            album.id === id
              ? {
                  ...album,
                  ...patch,
                  title:
                    patch.title !== undefined
                      ? patch.title.trim() || "Без названия"
                      : album.title,
                  description:
                    patch.description !== undefined
                      ? patch.description.trim()
                      : album.description,
                }
              : album,
          ),
        })),

      addAlbumImage: (id, image) =>
        set((s) => ({
          albums: s.albums.map((album) =>
            album.id === id
              ? {
                  ...album,
                  coverUri: album.coverUri ?? image.uri,
                  images: [...album.images, image],
                }
              : album,
          ),
        })),

      removeAlbumImage: (id, imageId) =>
        set((s) => ({
          albums: s.albums.map((album) => {
            if (album.id !== id) {
              return album;
            }

            const images = album.images.filter((image) => image.id !== imageId);

            return {
              ...album,
              images,
              coverUri:
                album.coverUri &&
                images.some((image) => image.uri === album.coverUri)
                  ? album.coverUri
                  : images[0]?.uri,
            };
          }),
        })),

      reorderAlbumImages: (id, orderedIds) =>
        set((s) => ({
          albums: s.albums.map((album) => {
            if (album.id !== id) {
              return album;
            }

            const byId = new Map(
              album.images.map((image) => [image.id, image]),
            );

            const ordered = orderedIds
              .map((imageId) => byId.get(imageId))
              .filter((image): image is MediaBlock => !!image);

            return {
              ...album,
              images: ordered,
            };
          }),
        })),

      reorderAlbums: (orderedIds) =>
        set((s) => {
          const byId = new Map(s.albums.map((album) => [album.id, album]));

          const ordered = orderedIds
            .map((id) => byId.get(id))
            .filter((album): album is Album => !!album);

          const orderedSet = new Set(orderedIds);

          const remaining = s.albums.filter(
            (album) => !orderedSet.has(album.id),
          );

          return {
            albums: [...ordered, ...remaining],
          };
        }),

      removeAlbum: (id) =>
        set((s) => ({
          albums: s.albums.filter((album) => album.id !== id),

          notes: s.notes.map((note) => ({
            ...note,
            albumIds: note.albumIds?.filter((x) => x !== id),
          })),

          todos: s.todos.map((todo) => ({
            ...todo,
            albumIds: todo.albumIds?.filter((x) => x !== id),
          })),

          tasks: s.tasks.map((task) => ({
            ...task,
            albumIds: task.albumIds?.filter((x) => x !== id),
          })),
        })),

      addTodo: (folderId, text, extra) => {
        const id = uid();

        set((s) => ({
          todos: [
            ...s.todos,
            {
              id,
              folderId,
              text: text.trim(),
              done: false,
              ...extra,
            },
          ],
        }));

        return id;
      },

      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  ...patch,
                }
              : todo,
          ),
        })),

      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  done: !todo.done,
                }
              : todo,
          ),
        })),

      removeTodo: (id) =>
        set((s) => ({
          todos: s.todos.filter((todo) => todo.id !== id),
        })),

      reorderTodos: (folderId, orderedIds) =>
        set((s) => {
          const byId = new Map(s.todos.map((todo) => [todo.id, todo]));

          const mine = orderedIds
            .map((id) => byId.get(id))
            .filter((todo): todo is Todo => !!todo);

          return {
            todos: [
              ...s.todos.filter((todo) => todo.folderId !== folderId),
              ...mine,
            ],
          };
        }),

      clearDoneTodos: (folderId) =>
        set((s) => ({
          todos: s.todos.filter(
            (todo) =>
              !(todo.folderId === folderId && todo.done && !todo.heading),
          ),
        })),

      addCustomColor: (hex) =>
        set((s) =>
          s.customColors.includes(hex)
            ? s
            : {
                customColors: [...s.customColors, hex].slice(-24),
              },
        ),

      removeCustomColor: (hex) =>
        set((s) => ({
          customColors: s.customColors.filter((color) => color !== hex),
        })),

      setThemePref: (themePref) =>
        set({
          themePref,
        }),

      setBackground: (backgroundPref) =>
        set({
          backgroundPref,
        }),

      setDarkBackground: (darkBackgroundPref) =>
        set({
          darkBackgroundPref,
        }),

      setName: (name) =>
        set({
          name,
        }),

      setNotifications: (notifications) =>
        set({
          notifications,
        }),

      resetData: () =>
        set({
          habits: [],
          tasks: [],
          notes: [],
          moodLog: {},
          focusSessions: [],
          moodEntries: [],
          todos: [],
          albums: [],
          folders: [
            {
              id: "inbox",
              name: "Входящие",
              color: "#6B8A6E",
              createdAt: new Date().toISOString(),
            },
          ],
        } as any),
    }),

    {
      name: "remindme-store",
      version: 3,

      storage: createJSONStorage(() => AsyncStorage),

      partialize: (s) => ({
        habits: s.habits,
        tasks: s.tasks,
        notes: s.notes,
        moodLog: s.moodLog,
        focusSessions: s.focusSessions,
        moodEntries: s.moodEntries,
        folders: s.folders,
        todos: s.todos,
        customColors: s.customColors,
        themePref: s.themePref,
        backgroundPref: s.backgroundPref,
        darkBackgroundPref: s.darkBackgroundPref,
        name: s.name,
        notifications: s.notifications,
        albums: s.albums,
      }),

      migrate: (state: any) => ({
        ...state,
        albums: (state?.albums ?? []).map((album: any) => ({
          ...album,
          description: album.description ?? "",
          color: album.color ?? undefined,
        })),
        darkBackgroundPref: state?.darkBackgroundPref ?? "graphite",
      }),
    },
  ),
);

export const countToday = (h: Habit) => h.log[dateKey()] ?? 0;

export const useTodayMood = () =>
  useAppStore((s) => s.moodLog[dateKey()] ?? null);
