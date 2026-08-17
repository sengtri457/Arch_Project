"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaPinterest, FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaBehance, FaWeixin, FaTelegram, FaGlobe, FaWhatsapp } from "react-icons/fa"
import { getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, profile } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [mounted])

  const navLinks = [
    { href: "/courses", label: "Courses" },
    { href: "/projects", label: "Project" },
    { href: "/about", label: "About" },
    { href: "#contact", label: "Contact" },
  ]

  const socialLinks = [
    { href: "https://www.pinterest.com/archtipsbox/", icon: FaPinterest, label: "Pinterest" },
    { href: "https://www.instagram.com/archtipsbox?igsh=bTgwbHJxaHoyNGpv&utm_source=qr", icon: FaInstagram, label: "Instagram" },
    { href: "https://www.tiktok.com/@archtipsbox?_t=ZS-90p29Q9jQxx&_r=1", icon: FaTiktok, label: "TikTok" },
    { href: "http://www.youtube.com/@ArchTipsbox-x7h", icon: FaYoutube, label: "YouTube" },
    { href: "https://www.behance.net/archtipsbox", icon: FaBehance, label: "Behance" },
    { href: "https://t.me/bunsambath10", icon: FaTelegram, label: "Telegram" },
  ]

  const navClassName = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    mounted && isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
  }`

  return (
    <nav className={navClassName} suppressHydrationWarning>
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src={getMediaUrl("/projects/Tipsbox logo png.png")}
              alt="Tipsbox Logo"
              className="h-20 w-auto hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation and Social Media Icons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pr-4 mr-4 border-r border-border">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-6 h-6" />
                  </a>
                )
              })}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-primary transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}

            <a
              href="https://t.me/bunsambath10"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium rounded-md"
            >
              Get in Touch
            </a>

            {user ? (
              <Link
                href={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                className="inline-flex items-center justify-center px-6 py-2 border transition-all duration-300 font-medium rounded-md text-white hover:text-primary hover:border-primary/80"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-2 border transition-all duration-300 font-medium rounded-md text-white hover:text-primary hover:border-primary/80"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-primary transition-colors font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Social Media Icons */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary transition-all duration-300 hover:scale-110"
                    aria-label={social.label}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                )
              })}
            </div>

            <a
              href="https://t.me/bunsambath10"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium rounded-md w-full"
            >
              Get in Touch
            </a>

            {user ? (
              <Link
                href={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                className="inline-flex items-center justify-center px-8 py-2 border border-zinc-800 text-white hover:border-primary/80 hover:text-primary transition-all duration-300 font-medium rounded-md w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-2 border border-zinc-800 text-white hover:border-primary/80 hover:text-primary transition-all duration-300 font-medium rounded-md w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
