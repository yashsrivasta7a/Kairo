import { create } from 'zustand'

interface CreateModalStore {
    isOpen: boolean
    appName: string
    open: () => void
    close: () => void
    toggle: () => void
    setAppName: (name: string) => void
}

export const useCreateModalStore = create<CreateModalStore>((set) => ({
    isOpen: false,
    appName: '',
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setAppName: (name) => set({ appName: name }),
}))
