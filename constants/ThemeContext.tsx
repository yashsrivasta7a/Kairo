import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'nativewind';

const ThemeContext = createContext({ toggleTheme: () => { }, isDark: false });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <ThemeContext.Provider value={{ toggleTheme: toggleColorScheme, isDark: colorScheme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);