import { create } from 'zustand';

export type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  hasImage?: boolean;
  id?: string; // from history, used for lazy image loading
};

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
};

interface PlaygroundState {
  input: string;
  messages: Message[];
  isLoading: boolean;
  activeSubnet: string;
  selectedModel: string;
  routedSubnet: string | null;
  routingStep: 'idle' | 'routing' | 'processing' | 'received';
  conversationId: string | null;
  isHistoryLoading: boolean;
  conversations: Conversation[];

  setInput: (input: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveSubnet: (activeSubnet: string) => void;
  setSelectedModel: (selectedModel: string) => void;
  setRoutedSubnet: (routedSubnet: string | null) => void;
  setRoutingStep: (routingStep: 'idle' | 'routing' | 'processing' | 'received') => void;
  setConversationId: (conversationId: string | null) => void;
  setIsHistoryLoading: (isHistoryLoading: boolean) => void;
  setConversations: (conversations: Conversation[]) => void;
  clearCurrentChat: () => void;
  reset: () => void;
}

export const usePlaygroundStore = create<PlaygroundState>((set) => ({
  input: "",
  messages: [],
  isLoading: false,
  activeSubnet: "subnet-64", // Default subnet
  selectedModel: "Qwen/Qwen3-32B-TEE", // Default model id
  routedSubnet: null,
  routingStep: 'idle',
  conversationId: null,
  isHistoryLoading: false,
  conversations: [],

  setInput: (input) => set({ input }),
  setMessages: (messagesUpdater) => set((state) => ({
    messages: typeof messagesUpdater === 'function' ? messagesUpdater(state.messages) : messagesUpdater
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveSubnet: (activeSubnet) => set({ activeSubnet }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setRoutedSubnet: (routedSubnet) => set({ routedSubnet }),
  setRoutingStep: (routingStep) => set({ routingStep }),
  setConversationId: (conversationId) => set({ conversationId }),
  setIsHistoryLoading: (isHistoryLoading) => set({ isHistoryLoading }),
  setConversations: (conversations) => set({ conversations }),
  clearCurrentChat: () => set({
    input: "",
    messages: [],
    conversationId: null,
    routedSubnet: null,
    routingStep: 'idle',
  }),
  reset: () => set({
    input: "",
    messages: [],
    isLoading: false,
    activeSubnet: "subnet-64",
    selectedModel: "Qwen/Qwen3-32B-TEE",
    routedSubnet: null,
    routingStep: 'idle',
    conversationId: null,
    isHistoryLoading: false,
    conversations: [],
  }),
}));
