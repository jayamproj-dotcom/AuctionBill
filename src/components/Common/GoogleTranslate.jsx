import React, { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
];

// Read current language from cookie
const getCookieLang = () => {
  const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]+)/);
  if (match) {
    // cookie format: /en/ta  → last segment is target lang
    const parts = decodeURIComponent(match[1]).split('/');
    return parts[parts.length - 1] || 'en';
  }
  return 'en';
};

// Set googtrans cookie on both domain forms (required by Google Translate)
const setGoogTransCookie = (lang) => {
  const value = lang === 'en' ? '' : `/en/${lang}`;
  // Set on current domain
  document.cookie = `googtrans=${value}; path=/`;
  // Set on .domain (Google checks both)
  document.cookie = `googtrans=${value}; path=/; domain=${window.location.hostname}`;
};

const GoogleTranslate = () => {
  const [selected, setSelected] = useState(() => getCookieLang());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Inject Google Translate script + suppress its default UI
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      const el = document.getElementById('google_translate_element_hidden');
      if (el && !el.dataset.initialized) {
        el.dataset.initialized = 'true';
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ta',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element_hidden'
        );
      }
    };

    const scriptId = 'google-translate-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate) {
      window.googleTranslateElementInit();
    }

    // Inject base CSS to prevent layout shift
    const styleId = 'gt-suppress-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        #google_translate_element_hidden { display: none !important; }
        .goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        #google-translate-element { display: none !important; }
        body {
          top: 0px !important;
          margin-top: 0px !important;
          padding-top: 0px !important;
        }
        .goog-tooltip, .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    // MutationObserver: kill the banner frame the instant Google injects it
    const suppressBanner = () => {
      // Hide the iframe bar
      const banners = document.querySelectorAll('.goog-te-banner-frame, iframe.skiptranslate');
      banners.forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });
      // Reset body top offset that Google sets inline
      if (document.body.style.top && document.body.style.top !== '0px') {
        document.body.style.setProperty('top', '0px', 'important');
        document.body.style.setProperty('margin-top', '0px', 'important');
      }
    };

    // Run immediately and also on every DOM mutation
    suppressBanner();
    const observer = new MutationObserver(suppressBanner);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });

    return () => observer.disconnect();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (langCode) => {
    if (langCode === selected) {
      setIsOpen(false);
      return;
    }

    setSelected(langCode);
    setIsOpen(false);

    // 1. Set the googtrans cookie (the reliable method)
    setGoogTransCookie(langCode);

    // 2. Also try to drive the hidden combo for SPA behaviour (no reload needed if this works)
    const tryCombo = (attempts = 0) => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = langCode;
        combo.dispatchEvent(new Event('change'));

        // For "back to English" Google requires clearing the translation
        if (langCode === 'en') {
          // Attempt to use the restore function if available
          const frame = document.querySelector('.goog-te-banner-frame');
          if (frame) {
            const restoreBtn = frame.contentDocument?.querySelector('.goog-te-banner-actions button');
            restoreBtn?.click();
          }
        }
      } else if (attempts < 8) {
        setTimeout(() => tryCombo(attempts + 1), 200);
      } else {
        // Fallback: reload so the cookie takes effect
        window.location.reload();
      }
    };

    tryCombo();
  };

  const currentLang = LANGUAGES.find((l) => l.code === selected);

  return (
    <>
      {/* Hidden Google Translate widget */}
      <div id="google_translate_element_hidden" aria-hidden="true" />

      {/* Custom dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setIsOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            background: 'var(--bg-card, #fff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            color: 'var(--text-primary, #111827)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f59e0b';
            e.currentTarget.style.background = 'rgba(245,158,11,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)';
            e.currentTarget.style.background = 'var(--bg-card, #fff)';
          }}
        >
          <Globe size={14} color="#f59e0b" />
          <span>{currentLang?.label}</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              transition: 'transform 0.2s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              opacity: 0.5,
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOpen && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: '140px',
              background: 'var(--bg-card, #fff)',
              border: '1px solid var(--border-color, #e5e7eb)',
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.13)',
              overflow: 'hidden',
              zIndex: 9999,
              animation: 'gtDropIn 0.15s ease-out',
            }}
          >
            <style>{`
              @keyframes gtDropIn {
                from { opacity: 0; transform: translateY(-6px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>

            {LANGUAGES.map((lang) => {
              const isActive = selected === lang.code;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    background: isActive ? 'rgba(245,158,11,0.1)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#f59e0b' : 'var(--text-primary, #111827)',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Checkmark or spacer */}
                  {isActive ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#f59e0b" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{ width: 12, flexShrink: 0 }} />
                  )}
                  {lang.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default GoogleTranslate;
