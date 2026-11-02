"use client"

import { RenderIcon } from "@/components/render-icon"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X, ChevronDown, Globe, QrCode, BookOpen, ExternalLink, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaPinterest, FaInstagram, FaTiktok, FaFacebook, FaYoutube, FaBehance, FaWeixin, FaTelegram, FaGlobe, FaWhatsapp } from "react-icons/fa"
import { getMediaUrl } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { siteConfig } from "@/lib/seo"
import { DEFAULT_GUMROAD_D5_URL } from "@/lib/gumroad"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false)
  const [isMobileCoursesOpen, setIsMobileCoursesOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  // Close desktop dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCoursesDropdownOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCoursesDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const navLinks = [
    { href: "/projects", label: "Project" },
    { href: "/student-work", label: "Student Work" },
    { href: "/media", label: "Media" },
    { href: "/about", label: "About" },
    { href: "#contact", label: "Contact" },
  ]

  const socialLinks = [
    { href: siteConfig.socials.facebook, icon: FaFacebook, label: "Facebook" },
    { href: "https://www.pinterest.com/archtipsbox/", icon: FaPinterest, label: "Pinterest" },
    { href: "https://www.instagram.com/archtipsbox?igsh=bTgwbHJxaHoyNGpv&utm_source=qr", icon: FaInstagram, label: "Instagram" },
    { href: "https://www.tiktok.com/@archtipsbox?_t=ZS-90p29Q9jQxx&_r=1", icon: FaTiktok, label: "TikTok" },
    { href: "http://www.youtube.com/@ArchTipsbox-x7h", icon: FaYoutube, label: "YouTube" },
    { href: "https://www.behance.net/archtipsbox", icon: FaBehance, label: "Behance" },
    { href: "https://t.me/bunsambath10", icon: FaTelegram, label: "Telegram" },
  ]

  const navClassName = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    mounted && (isScrolled || isMobileMenuOpen) ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg" : "bg-transparent"
  }`

  return (
    <nav className={navClassName} suppressHydrationWarning>
      <div className="container mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src={getMediaUrl("/projects/Tipsbox logo png.png")}
              alt="Tipsbox Logo"
              className="h-12 sm:h-16 md:h-20 w-auto hover:opacity-80 transition-opacity object-contain"
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
                    <RenderIcon icon={IconComponent} className="w-6 h-6" />
                  </a>
                )
              })}
            </div>

            {/* Courses Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setIsCoursesDropdownOpen(true)}
              onMouseLeave={() => setIsCoursesDropdownOpen(false)}
            >
              <button
                id="courses-menu-button"
                type="button"
                onClick={() => setIsCoursesDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-white hover:text-primary transition-colors font-medium py-2 focus:outline-none cursor-pointer"
                aria-haspopup="true"
                aria-expanded={isCoursesDropdownOpen}
                aria-controls="courses-menu"
              >
                <span>Courses</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isCoursesDropdownOpen ? "rotate-180 text-primary" : "text-zinc-400"
                  }`}
                />
              </button>

              {isCoursesDropdownOpen && (
                <div
                  id="courses-menu"
                  role="menu"
                  aria-labelledby="courses-menu-button"
                  className="absolute top-full left-0 mt-2 w-[380px] bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-zinc-850/80 mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                      Select Learning Pathway
                    </p>
                    <span className="text-[10px] text-zinc-500 font-medium">Multiple Masterclasses</span>
                  </div>

                  {/* National / Local Students */}
                  <Link
                    href="/courses?audience=national"
                    role="menuitem"
                    onClick={() => setIsCoursesDropdownOpen(false)}
                    className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-zinc-900/90 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#9ACD32]/10 border border-[#9ACD32]/25 flex items-center justify-center text-[#9ACD32] shrink-0 group-hover:bg-[#9ACD32] group-hover:text-black transition-colors">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors whitespace-nowrap">
                          National Students
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0 whitespace-nowrap">
                          🇰🇭 Cambodia
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Local curriculum, ABA Bank & Bakong KHQR instant scan
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Link>

                  {/* International Students */}
                  <Link
                    href="/courses?audience=international"
                    role="menuitem"
                    onClick={() => setIsCoursesDropdownOpen(false)}
                    className="group flex items-start gap-3.5 p-3 rounded-xl hover:bg-zinc-900/90 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors whitespace-nowrap">
                          International Students
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-800/60 shrink-0 whitespace-nowrap">
                          🌐 Global
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Choose course & enroll via Cards, Apple Pay or Gumroad
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Link>

                  <div className="border-t border-zinc-850/80 my-1.5" />

                  {/* Browse All Courses */}
                  <Link
                    href="/courses"
                    role="menuitem"
                    onClick={() => setIsCoursesDropdownOpen(false)}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 text-xs text-zinc-400 hover:text-white transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-zinc-500 group-hover:text-primary transition-colors" />
                      <span>Browse Full Catalog (All Levels)</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 group-hover:text-primary font-mono transition-colors">
                      View All →
                    </span>
                  </Link>
                </div>
              )}
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
            className="md:hidden text-foreground p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pb-6 flex flex-col gap-3 max-h-[85vh] overflow-y-auto px-1 border-t border-border/40 pt-4">
            {/* Mobile Courses Accordion */}
            <div className="border-b border-border/40 pb-3">
              <button
                type="button"
                onClick={() => setIsMobileCoursesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-white hover:text-primary transition-colors font-medium text-base py-1"
              >
                <span>Courses</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isMobileCoursesOpen ? "rotate-180 text-primary" : "text-zinc-400"
                  }`}
                />
              </button>

              {isMobileCoursesOpen && (
                <div className="pl-2 mt-2 space-y-2 border-l border-zinc-800 ml-1">
                  <Link
                    href="/courses?audience=national"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-left transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-[#9ACD32] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">National Students</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">🇰🇭</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Local Bakong & KHQR scan</p>
                    </div>
                  </Link>

                  <Link
                    href="/courses?audience=international"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-left transition-colors"
                  >
                    <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">International Students</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-950 text-sky-300">🌐</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Choose course & enroll via Cards / Gumroad</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-1" />
                  </Link>

                  <Link
                    href="/courses"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-1.5 px-2 text-xs text-zinc-400 hover:text-white"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Browse All Courses Catalog</span>
                  </Link>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white hover:text-primary transition-colors font-medium text-base py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Social Media Icons */}
            <div className="flex items-center gap-4 pt-3 border-t border-border/50">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-primary transition-all duration-300 hover:scale-110 p-1"
                    aria-label={social.label}
                  >
                    <RenderIcon icon={IconComponent} className="w-5 h-5" />
                  </a>
                )
              })}
            </div>

            <a
              href="https://t.me/bunsambath10"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium rounded-md w-full mt-2"
            >
              Get in Touch
            </a>

            {user ? (
              <Link
                href={profile?.role === 'admin' ? '/admin' : '/dashboard'}
                className="inline-flex items-center justify-center px-8 py-2.5 border border-zinc-800 text-white hover:border-primary/80 hover:text-primary transition-all duration-300 font-medium rounded-md w-full"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Portal
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-2.5 border border-zinc-800 text-white hover:border-primary/80 hover:text-primary transition-all duration-300 font-medium rounded-md w-full"
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
