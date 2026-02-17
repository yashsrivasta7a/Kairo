import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'nativewind';

const ThemeContext = createContext({ toggleTheme: () => { } });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <ThemeContext.Provider value={{ toggleTheme: toggleColorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);