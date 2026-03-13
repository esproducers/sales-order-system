'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type FontSize = 'small' | 'medium' | 'large'

interface ThemeContextType {
    fontSize: FontSize
    setFontSize: (size: FontSize) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [fontSize, setFontSizeState] = useState<FontSize>('medium')

    useEffect(() => {
        const saved = localStorage.getItem('app-font-size') as FontSize
        if (saved && ['small', 'medium', 'large'].includes(saved)) {
            setFontSizeState(saved)
        }
    }, [])

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size)
        localStorage.setItem('app-font-size', size)
    }

    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize)
    }, [fontSize])

    return (
        <ThemeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
            <style dangerouslySetInnerHTML={{
                __html: `
                html[data-font-size='small'] { font-size: 13px !important; }
                html[data-font-size='medium'] { font-size: 16px !important; }
                html[data-font-size='large'] { font-size: 19px !important; }
            `}} />
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within ThemeProvider')
    return context
}
