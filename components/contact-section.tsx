"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FaInstagram, FaLinkedin, FaTiktok, FaFacebook, FaYoutube, FaBehance, FaWeixin, FaTelegram, FaPinterest, FaGlobe, FaWhatsapp } from "react-icons/fa"

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  })
  const [honeypot, setHoneypot] = useState("")
  const [formStartedAt, setFormStartedAt] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          company_website: honeypot,
          started_at: formStartedAt,
        }),
      })
      const result = await response.json()
      if (response.ok && result.success) {
        alert("Thank you for your message! We'll get back to you soon.")
        setFormData({ name: "", email: "", company: "", message: "" })
      } else {
        alert(`Failed to submit message: ${result.error || 'Unknown error'}`)
      }
    } catch (err: any) {
      console.error(err)
      alert("Failed to submit message. Please check your network and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formStartedAt) {
      setFormStartedAt(Date.now())
    }
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      values: [
        { value: "archtipsbox@gmail.com", href: "mailto:archtipsbox@gmail.com" },
      ],
    },
    {
      icon: FaTelegram,
      label: "Telegram",
      values: [
        { value: "@bunsambath10", href: "https://t.me/bunsambath10" },
      ],
    },
    {
      icon: Phone,
      label: "Phone",
      values: [
        { value: "+855 88 765 1615", href: "tel:+855887651615" },
      ],
    },
    {
      icon: MapPin,
      label: "Location",
      values: [
        { value: "Phnom Penh, Cambodia", href: null },
      ],
    },
  ]

  return (
    <section id="contact" className="py-24 bg-background" suppressHydrationWarning>
      <div className="container mx-auto px-6" suppressHydrationWarning>
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-4">Let's Work Together</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ready to bring your architectural vision to life? Get in touch and let's discuss your project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-card border-border text-foreground"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-card border-border text-foreground"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Company
                </label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  disabled={isSubmitting}
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full bg-card border-border text-foreground"
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  disabled={isSubmitting}
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full bg-card border-border text-foreground resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>

              <input
                type="text"
                name="company_website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="mr-2" size={20} />
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Get in Touch</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Whether you're an architect, developer, or designer, we're here to help you create stunning
                visualizations that bring your projects to life. Reach out to discuss your needs and get a quote.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 flex-shrink-0">
                      <Icon className="text-primary" size={24} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{info.label}</div>
                      <div className="flex flex-col gap-1">
                        {info.values.map((item, idx) => (
                          item.href ? (
                            <a
                              key={idx}
                              href={item.href}
                              className="text-foreground hover:text-primary transition-colors font-medium"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <div key={idx} className="text-foreground font-medium">
                              {item.value}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-card p-6 mt-8">
              <h4 className="text-lg font-semibold text-foreground mb-3">Business Hours</h4>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="p-6 mt-4" style={{ backgroundColor: '#141414' }}>
              <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
              <div className="flex flex-wrap justify-center gap-4">
                {/* Website */}
                <a 
                  href="https://archtipsbox.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary transition-colors duration-300"
                  title="Visit our website"
                >
                  <FaGlobe className="w-8 h-8" />
                </a>
                
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/archtipsbox?igsh=bTgwbHJxaHoyNGpv&utm_source=qr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#E4405F] transition-colors duration-300"
                  title="Instagram"
                >
                  <FaInstagram className="w-8 h-8" />
                </a>
                
                {/* TikTok */}
                <a 
                  href="https://www.tiktok.com/@archtipsbox?_t=ZS-90p29Q9jQxx&_r=1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#69C9D0] transition-colors duration-300"
                  title="TikTok"
                >
                  <FaTiktok className="w-8 h-8" />
                </a>
                
                {/* YouTube */}
                <a 
                  href="http://www.youtube.com/@ArchTipsbox-x7h" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#FF0000] transition-colors duration-300"
                  title="YouTube"
                >
                  <FaYoutube className="w-8 h-8" />
                </a>
                
                {/* Behance */}
                <a 
                  href="https://www.behance.net/archtipsbox" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#1769FF] transition-colors duration-300"
                  title="Behance"
                >
                  <FaBehance className="w-8 h-8" />
                </a>
                
                {/* Pinterest */}
                <a 
                  href="https://www.pinterest.com/archtipsbox/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#BD081C] transition-colors duration-300"
                  title="Pinterest"
                >
                  <FaPinterest className="w-8 h-8" />
                </a>
                
                {/* Telegram */}
                <a 
                  href="https://t.me/bunsambath10" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-[#0088cc] transition-colors duration-300"
                  title="Telegram"
                >
                  <FaTelegram className="w-8 h-8" />
                </a>
                
                {/* Gumroad */}
                <a 
                  href="https://archtipsbox.gumroad.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-primary transition-colors duration-300"
                  title="Gumroad"
                >
                  <FaGlobe className="w-8 h-8" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
