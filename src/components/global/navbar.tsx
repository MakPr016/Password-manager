"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { ThemeToggleButton, useThemeTransition } from '@/components/ui/theme-toggle-button'
import Image from 'next/image'
import { Button } from '../ui/button'
import {Rocket} from "lucide-react"

const Navbar = () => {
    const { theme, setTheme } = useTheme()
    const { startTransition } = useThemeTransition()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark'

        startTransition(() => {
            setTheme(newTheme)
        })
    }

    const currentTheme = (theme === 'system' ? 'light' : theme) as 'light' | 'dark'

    if (!mounted) {
        return null
    }
    return (
        <header className='fixed font-sans right-0 left-0 top-0 py-4 px-4 bg-white/60  dark:bg-black/40 backdrop-blur-lg z-[100] flex items-center border-b-[1px] border-neutral-200 dark:border-neutral-800 justify-between'>
            <aside>
                <Image
                    src={theme === 'dark' ? '/logo-dark.png' : '/logo.png'}
                    alt="Logo"
                    width={0}
                    height={32}
                    sizes="100vw"
                    style={{ width: 'auto', height: '24px' }}
                />
            </aside>
            <aside className='flex items-center gap-2'>
                <Button variant='default' className='rounded-sm'>
                    <span className='hidden md:block'>Get Started</span><Rocket />
                </Button>
                <ThemeToggleButton
                    theme={currentTheme}
                    onClick={handleThemeToggle}
                    variant="circle"
                    start="top-right"
                />
            </aside>
        </header>
    )
}

export default Navbar
