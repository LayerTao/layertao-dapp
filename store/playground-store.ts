import { create } from 'zustand';

export type Message = {
  role: "user" | "assistant";
  content: string;
};

interface PlaygroundState {
  input: string;
  messages: Message[];
  isLoading: boolean;
  activeSubnet: string;
  selectedModel: string;
  routedSubnet: string | null;
  routingStep: 'idle' | 'routing' | 'processing' | 'received';

  setInput: (input: string) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveSubnet: (activeSubnet: string) => void;
  setSelectedModel: (selectedModel: string) => void;
  setRoutedSubnet: (routedSubnet: string | null) => void;
  setRoutingStep: (routingStep: 'idle' | 'routing' | 'processing' | 'received') => void;
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

  setInput: (input) => set({ input }),
  setMessages: (messagesUpdater) => set((state) => ({
    messages: typeof messagesUpdater === 'function' ? messagesUpdater(state.messages) : messagesUpdater
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveSubnet: (activeSubnet) => set({ activeSubnet }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setRoutedSubnet: (routedSubnet) => set({ routedSubnet }),
  setRoutingStep: (routingStep) => set({ routingStep }),
  reset: () => set({
    input: "",
    messages: [],
    isLoading: false,
    activeSubnet: "subnet-64",
    selectedModel: "Qwen/Qwen3-32B-TEE",
    routedSubnet: null,
    routingStep: 'idle',
  }),
}));
