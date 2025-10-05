'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface VaultCategoryContextType {
    refreshTrigger: number;
    triggerRefresh: () => void;
}

const VaultCategoryContext = createContext<VaultCategoryContextType | undefined>(undefined);

export function VaultCategoryProvider({ children }: { children: ReactNode }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <VaultCategoryContext.Provider value={{ refreshTrigger, triggerRefresh }}>
            {children}
        </VaultCategoryContext.Provider>
    );
}

export function useVaultCategory() {
    const context = useContext(VaultCategoryContext);
    if (context === undefined) {
        throw new Error('useVaultCategory must be used within a VaultCategoryProvider');
    }
    return context;
}
