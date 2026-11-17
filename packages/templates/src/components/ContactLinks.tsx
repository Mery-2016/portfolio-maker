import React from 'react';
import { Contacts } from '@cvb/shared';
import { Phone, Mail, Send, Linkedin, Globe } from 'lucide-react';

interface ContactLinksProps {
  contacts: Contacts;
  format: 'desktop' | 'mobile';
  className?: string;
  iconColor?: string;
}

export const ContactLinks: React.FC<ContactLinksProps> = ({
  contacts,
  format,
  className = '',
  iconColor = 'currentColor',
}) => {
  const isMobile = format === 'mobile';

  const items = [
    contacts.phone && {
      icon: <Phone size={isMobile ? 18 : 14} color={iconColor} strokeWidth={1.5} />,
      label: contacts.phone,
      href: `tel:${contacts.phone.replace(/[^+\d]/g, '')}`,
    },
    contacts.email && {
      icon: <Mail size={isMobile ? 18 : 14} color={iconColor} strokeWidth={1.5} />,
      label: contacts.email,
      href: `mailto:${contacts.email}`,
    },
    contacts.telegram && {
      icon: <Send size={isMobile ? 18 : 14} color={iconColor} strokeWidth={1.5} />,
      label: contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`,
      href: `https://t.me/${contacts.telegram.replace(/^@/, '')}`,
    },
    contacts.linkedin && {
      icon: <Linkedin size={isMobile ? 18 : 14} color={iconColor} strokeWidth={1.5} />,
      label: 'LinkedIn',
      href: contacts.linkedin.startsWith('http') ? contacts.linkedin : `https://${contacts.linkedin}`,
    },
    contacts.website && {
      icon: <Globe size={isMobile ? 18 : 14} color={iconColor} strokeWidth={1.5} />,
      label: contacts.website.replace(/^https?:\/\//, ''),
      href: contacts.website.startsWith('http') ? contacts.website : `https://${contacts.website}`,
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; href: string }>;

  if (items.length === 0) return null;

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-2 w-full ${className}`}>
        {items.map((item, idx) => (
          <a
            key={idx}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded text-sm text-[var(--ink)] bg-[var(--accent-soft)] hover:bg-[var(--rule)] transition-colors min-h-[44px]"
            style={{ textDecoration: 'none' }}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="font-medium truncate">{item.label}</span>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--muted)] ${className}`}>
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-[var(--text)] transition-colors"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <span className="shrink-0 opacity-80">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </a>
      ))}
    </div>
  );
};
