"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompass,
  faHammer,
  faDoorOpen,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";
import { getPlatformStats } from "@/lib/platform-stats";
import PixelField from "./PixelField";
import StatCounter from "./StatCounter";
import LiveActivityFeed from "./LiveActivityFeed";
import FounderSignature from "./FounderSignature";
import styles from "./LoggedOutExperience.module.css";

const EXPLAINER_CARDS = [
  {
    icon: faHammer,
    title: "Make something",
    body: "A Space can be a page, a story, a hangout, a joke that got out of hand. There's no wrong way to start.",
  },
  {
    icon: faCompass,
    title: "Find something",
    body: "Discover is full of Spaces other people are building right now. Trending, new, weird, all of it.",
  },
  {
    icon: faDoorOpen,
    title: "Enter something",
    body: "No downloads, no loading screens that lie to you. You click Enter and you're in.",
  },
  {
    icon: faUserGroup,
    title: "Bring people",
    body: "Add friends, see who's around, and drag them into whatever you just made.",
  },
];

export default function LoggedOutExperience() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getPlatformStats().then((data) => {
      if (isMounted) setStats(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const loading = stats === null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.wordmark}>Kobbleston</span>
        <nav className={styles.topbarActions}>
          <Link href="/sign-in" className={styles.ghostButton}>
            Sign in
          </Link>
          <Link href="/join" className={styles.primaryButton}>
            Join Kobbleston
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <PixelField className={styles.heroField} />
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Welcome to Kobbleston</h1>
            <p className={styles.heroTagline}>Pixels go brrr</p>
            <p className={styles.heroSubtext}>
              A place to make your own little corner of the internet, share
              it with people, and see what everyone else is building.
            </p>
            <div className={styles.heroActions}>
              <Link href="/join" className={styles.primaryButtonLarge}>
                Join Kobbleston
              </Link>
              <Link href="/discover" className={styles.ghostButtonLarge}>
                See what people made
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.statsSection} aria-label="Platform activity">
          <div className={styles.statsFeatured}>
            <StatCounter
              value={stats?.totalVisits ?? 0}
              label="visits across every Space"
              loading={loading}
              numberClassName={styles.statFeaturedNumber}
              labelClassName={styles.statFeaturedLabel}
            />
          </div>
          <div className={styles.statsGrid}>
            <StatCounter
              value={stats?.publishedSpaces ?? 0}
              label="Spaces published"
              loading={loading}
              numberClassName={styles.statNumber}
              labelClassName={styles.statLabel}
            />
            <StatCounter
              value={stats?.totalUpdates ?? 0}
              label="updates shipped"
              loading={loading}
              numberClassName={styles.statNumber}
              labelClassName={styles.statLabel}
            />
            <StatCounter
              value={stats?.accounts ?? 0}
              label="people on Kobbleston"
              loading={loading}
              numberClassName={styles.statNumber}
              labelClassName={styles.statLabel}
            />
          </div>
        </section>

        <section className={styles.activitySection}>
          <div className={styles.activityHeader}>
            <span className={styles.activityLiveDot} aria-hidden="true" />
            <h2 className={styles.activityHeading}>Happening now</h2>
          </div>
          <LiveActivityFeed />
        </section>

        <section className={styles.explainerSection}>
          <h2 className={styles.explainerHeading}>Make something.</h2>
          <div className={styles.explainerGrid}>
            {EXPLAINER_CARDS.map((card) => (
              <div key={card.title} className={styles.explainerCard}>
                <FontAwesomeIcon icon={card.icon} className={styles.explainerIcon} />
                <h3 className={styles.explainerCardTitle}>{card.title}</h3>
                <p className={styles.explainerCardBody}>{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.founderSection}>
          <div className={styles.founderText}>
            <p className={styles.founderEyebrow}>Kobbleston was built by</p>
            <div className={styles.founderNameRow}>
              <span className={styles.founderName}>Staw</span>
              <FounderSignature />
            </div>
            <p className={styles.founderMessage}>
              I wanted a place on the internet that felt like the ones I grew
              up on — a little messy, made by real people, built because it
              was fun to build. Kobbleston is that, still figuring itself out
              as it goes. Thanks for being here early.
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span className={styles.wordmark}>Kobbleston</span>
        <p className={styles.footerTagline}>Pixels go brrr</p>
        <nav className={styles.footerLinks}>
          <Link href="/guidelines">Community Guidelines</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
