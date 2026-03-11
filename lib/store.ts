import { useSyncExternalStore } from 'react'

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

type CreateModalState = Omit<
    CreateModalStore,
    'open' | 'close' | 'toggle' | 'setAppName' | 'setBuildId' | 'setIsCreating'
>

let state: CreateModalState = {
    isOpen: false,
    appName: '',
    buildId: '',
    isCreating: false,
}

const listeners = new Set<() => void>()

function setState(update: Partial<CreateModalState> | ((current: CreateModalState) => Partial<CreateModalState>)) {
    const nextPatch = typeof update === 'function' ? update(state) : update
    state = { ...state, ...nextPatch }
    listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

function getSnapshot() {
    return state
}

export function useCreateModalStore(): CreateModalStore {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

    return {
        ...snapshot,
        open: () => setState({ isOpen: true }),
        close: () => setState({ isOpen: false }),
        toggle: () => setState((current) => ({ isOpen: !current.isOpen })),
        setAppName: (name: string) => setState({ appName: name }),
        setBuildId: (id: string) => setState({ buildId: id }),
        setIsCreating: (val: boolean) => setState({ isCreating: val }),
    }
}
