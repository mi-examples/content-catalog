import { useEffect, useState } from 'react';

import { cssUrl, ppVar, ppVarImage } from '../../constants';
import { LOGOS } from '../../helpers/logos';
import type { MIUserInfo } from '../../types';

import styles from './hero.module.scss';

type HeroProps = {
  user?: MIUserInfo;
  /** Provided only while the sidebar is an overlay drawer, i.e. on narrow viewports. */
  onOpenNavigation?: () => void;
};

/** "Good morning" / "Good afternoon" / "Good evening" for the current local time. */
export function getGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

const Hero = ({ user, onOpenNavigation }: HeroProps) => {
  const heroImage = ppVarImage('HERO_IMAGE');
  // The hero is always the dark brand banner, so the white lockup is the default
  const logo = ppVarImage('LOGO', LOGOS.whiteFull);
  const [logoBroken, setLogoBroken] = useState(false);

  useEffect(() => setLogoBroken(false), [logo]);

  const subtext = ppVar('HERO_SUBTEXT', 'Browse the reports and dashboards available to you.');

  // WELCOME_MESSAGE replaces the time-based prefix when the variable is set
  const prefix = ppVar('WELCOME_MESSAGE') || getGreeting();
  const name = user?.first_name?.trim() || user?.display_name?.trim() || '';
  const greeting = name.length ? `${prefix}, ${name}` : prefix;

  return (
    <header
      className={styles.hero}
      style={heroImage.length ? { backgroundImage: cssUrl(heroImage) } : undefined}
    >
      <div className={styles.hero__overlay} />
      <div className={styles.hero__content}>
        {onOpenNavigation ? (
          <button
            type="button"
            className={styles.hero__menu}
            onClick={onOpenNavigation}
            aria-label="Open the navigation"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        ) : null}
        <div className={styles.hero__text}>
          <h1 className={styles.hero__greeting}>{greeting}</h1>
          <p className={styles.hero__subtext}>{subtext}</p>
        </div>
        {logo.length && !logoBroken ? (
          <img
            className={styles.hero__logo}
            src={logo}
            alt="Logo"
            onError={() => setLogoBroken(true)}
          />
        ) : null}
      </div>
    </header>
  );
};

export default Hero;
