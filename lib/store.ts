import { create } from 'zustand'

interface CreateModalStore {
    isOpen: boolean
    appName: string
    buildId: string
    isCreating: boolean
    open: () => void
    close: () => void
    toggle: () => void
    setAppName: (name: string) => void
    setBuildId: (id: string) => void
    setIsCreating: (val: boolean) => void
}

export const useCreateModalStore = create<CreateModalStore>((set) => ({
    isOpen: false,
    appName: '',
    buildId: '',
    isCreating: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setAppName: (name) => set({ appName: name }),
    setBuildId: (id) => set({ buildId: id }),
    setIsCreating: (val) => set({ isCreating: val }),
}))
