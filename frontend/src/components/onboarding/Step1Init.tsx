'use client';
import { Bot, ChevronRight, MapPin, Users, User, Home, Sparkles, ChevronDown } from 'lucide-react';
import { OnboardingData } from '@/app/onboarding/page';
import s from '@/components/auth/auth.module.css';

interface Props {
  formData: OnboardingData;
  updateFormData: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev?: () => void;
}

export default function Step1Init({ formData, updateFormData, onNext, onPrev }: Props) {
  const isComplete = formData.homeName && formData.assistantName && formData.location && formData.householdType && formData.userAge;

  return (
    <div className={s.cardWide}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div className={s.headerIcon}>
          <svg viewBox="0 0 32 32" fill="none" style={{ width: 28, height: 28, color: 'var(--accent-orange)' }}>
            <circle cx="8" cy="8" r="3.2" fill="currentColor" />
            <circle cx="16" cy="5" r="2.8" fill="currentColor" />
            <circle cx="23" cy="8" r="3.2" fill="currentColor" />
            <circle cx="6" cy="16" r="2.8" fill="currentColor" />
            <circle cx="25" cy="16" r="2.8" fill="currentColor" />
            <circle cx="8" cy="23" r="3.2" fill="currentColor" />
            <circle cx="16" cy="26" r="2.8" fill="currentColor" />
          </svg>
          <div style={{
            position: 'absolute',
            top: -8,
            right: -8,
            padding: 6,
            background: '#4ade80',
            borderRadius: '50%',
            border: '2px solid var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={12} color="#fff" />
          </div>
        </div>
        <h1 className={s.title}>Welcome to HOMIEE</h1>
        <p className={s.subtitle}>Let&apos;s give your AI assistant some context.</p>
      </div>

      {/* Info Banner */}
      <div className={s.infoBanner} style={{ marginBottom: 24 }}>
        <Sparkles size={18} className={s.infoBannerIcon} />
        <p className={s.infoBannerText}>
          <strong className={s.infoBannerStrong}>Why do we need this?</strong>{' '}
          The LangGraph AI Agent uses your household type and age to tailor proactive decisions
          (e.g., enabling quiet hours for roommates or adjusting climate for kids).
        </p>
      </div>

      {/* Form Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Home Name + Assistant Name */}
        <div className={s.gridTwo}>
          <div>
            <label className={s.label}>
              <Home size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Home Name
            </label>
            <input
              type="text"
              placeholder="e.g. Berkay's Villa"
              value={formData.homeName}
              onChange={(e) => updateFormData({ homeName: e.target.value })}
              className={s.input}
            />
          </div>
          <div>
            <label className={s.label}>
              <Bot size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Assistant Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bob"
              value={formData.assistantName}
              onChange={(e) => updateFormData({ assistantName: e.target.value })}
              className={s.input}
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className={s.label}>
            <MapPin size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Location (For Weather AI)
          </label>
          <input
            type="text"
            placeholder="e.g. Istanbul, Turkey"
            value={formData.location}
            onChange={(e) => updateFormData({ location: e.target.value })}
            className={s.input}
          />
        </div>

        {/* Household Type + Age Group */}
        <div className={s.gridTwo}>
          <div>
            <label className={s.label}>
              <Users size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Household Type
            </label>
            <div className={s.selectWrapper}>
              <select
                value={formData.householdType}
                onChange={(e) => updateFormData({ householdType: e.target.value })}
                className={s.selectInput}
              >
                <option value="" disabled>Select dynamic...</option>
                <option value="Living Alone">Living Alone (Optimal)</option>
                <option value="Couple / Roommates">Couple / Roommates</option>
                <option value="Family with Kids">Family with Kids</option>
                <option value="Living with Pets">Living with Pets (Pet-Safe)</option>
              </select>
              <ChevronDown size={16} className={s.selectChevron} />
            </div>
          </div>

          <div>
            <label className={s.label}>
              <User size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Your Age Group
            </label>
            <div className={s.selectWrapper}>
              <select
                value={formData.userAge}
                onChange={(e) => updateFormData({ userAge: e.target.value })}
                className={s.selectInput}
              >
                <option value="" disabled>Select group...</option>
                <option value="18-30">18 - 30</option>
                <option value="31-50">31 - 50</option>
                <option value="51-65">51 - 65</option>
                <option value="65+">65+</option>
              </select>
              <ChevronDown size={16} className={s.selectChevron} />
            </div>
          </div>
        </div>
      </div>

      {/* Action Row */}
      <div className={s.actionRow}>
        {onPrev && (
          <button onClick={onPrev} className={s.btnSecondary} style={{ flex: 1, maxWidth: 180 }}>
            Back to Login
          </button>
        )}
        <button
          disabled={!isComplete}
          onClick={onNext}
          className={s.btnPrimary}
          style={{ flex: 2 }}
        >
          {isComplete ? 'Initialize Core System' : 'Complete Fields to Continue'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}