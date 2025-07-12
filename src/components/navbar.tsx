"use client"

import Link from "next/link"
import { useAuth } from "./../lib/client-auth"
import { AnimatedButton } from "@/components/ui/animated-button"
import { Input } from "@/components/ui/input"
import { Bell, Search, User, LogOut, Settings, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white border-b"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/" className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-white font-bold text-xl">S</span>
              </motion.div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                StackIt
              </span>
            </Link>
          </motion.div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <motion.div
              className="relative w-full"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="search"
                placeholder="Search questions..."
                className="pl-12 w-full bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
            </motion.div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Link href="/questions">
                <AnimatedButton variant="ghost" className="text-gray-700 hover:text-blue-600">
                  Browse
                </AnimatedButton>
              </Link>
            </motion.div>

            {user ? (
              <>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Link href="/ask">
                    <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                      Ask Question
                    </AnimatedButton>
                  </Link>
                </motion.div>

                {/* Notifications */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <AnimatedButton variant="ghost" size="icon" className="relative">
                        <Bell className="w-5 h-5" />
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500">
                          3
                        </Badge>
                      </AnimatedButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <div className="p-4">
                        <h3 className="font-semibold mb-3">Notifications</h3>
                        <div className="space-y-3">
                          <motion.div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer" whileHover={{ x: 4 }}>
                            <p className="text-sm font-medium">Your question was answered</p>
                            <p className="text-xs text-gray-500">2 hours ago</p>
                          </motion.div>
                          <motion.div className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer" whileHover={{ x: 4 }}>
                            <p className="text-sm font-medium">Someone voted on your answer</p>
                            <p className="text-xs text-gray-500">1 day ago</p>
                          </motion.div>
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>

                {/* User Menu */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="relative h-10 w-10 rounded-full"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {user.name?.charAt(0) || user.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-3">
                        <div className="flex flex-col space-y-1 leading-none">
                          <p className="font-medium">{user.name || user.username}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-blue-600">{user.reputation} reputation</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Link>
                      </DropdownMenuItem>
                      {user.isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Settings className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-red-600" onSelect={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <Link href="/auth/login">
                    <AnimatedButton variant="ghost" className="text-gray-700 hover:text-blue-600">
                      Login
                    </AnimatedButton>
                  </Link>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                  <Link href="/auth/register">
                    <AnimatedButton className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                      Sign Up
                    </AnimatedButton>
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <AnimatedButton
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </AnimatedButton>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input type="search" placeholder="Search questions..." className="pl-12 w-full" />
                  </div>
                </div>

                <Link href="/questions" className="block">
                  <AnimatedButton variant="ghost" className="w-full justify-start">
                    Browse Questions
                  </AnimatedButton>
                </Link>

                {user ? (
                  <>
                    <Link href="/ask" className="block">
                      <AnimatedButton className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        Ask Question
                      </AnimatedButton>
                    </Link>
                    <Link href="/profile" className="block">
                      <AnimatedButton variant="ghost" className="w-full justify-start">
                        Profile
                      </AnimatedButton>
                    </Link>
                    <AnimatedButton variant="ghost" className="w-full justify-start text-red-600" onClick={logout}>
                      Logout
                    </AnimatedButton>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="block">
                      <AnimatedButton variant="ghost" className="w-full justify-start">
                        Login
                      </AnimatedButton>
                    </Link>
                    <Link href="/auth/register" className="block">
                      <AnimatedButton className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        Sign Up
                      </AnimatedButton>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
