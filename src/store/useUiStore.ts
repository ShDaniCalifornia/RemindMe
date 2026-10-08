import { create } from "zustand";

type ChatMessage = {
  id: string;
  from: "me" | "ai";
  text: string;
  crisis?: boolean;
};

type ChatChip = {
  label: string;
  action: any;
  pose?: any;
  say?: string;
};

export const useUiStore = create<{
  drawerOpen: boolean;
  setDrawer: (v: boolean) => void;

  chatMessages: ChatMessage[];
  setChatMessages: (
    value: ChatMessage[] | ((value: ChatMessage[]) => ChatMessage[]),
  ) => void;

  chatChips: ChatChip[];
  setChatChips: (value: ChatChip[]) => void;

  chatStarted: boolean;
  setChatStarted: (value: boolean) => void;

  clearChat: () => void;
}>((set) => ({
  drawerOpen: false,

  setDrawer: (drawerOpen) => set({ drawerOpen }),

  chatMessages: [],

  setChatMessages: (next) =>
    set((state) => ({
      chatMessages:
        typeof next === "function" ? next(state.chatMessages) : next,
    })),

  chatChips: [],

  setChatChips: (chatChips) => set({ chatChips }),

  chatStarted: false,

  setChatStarted: (chatStarted) => set({ chatStarted }),

  clearChat: () =>
    set({
      chatMessages: [],
      chatChips: [],
      chatStarted: false,
    }),
}));
