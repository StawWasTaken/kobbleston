"use client";

import { useEffect, useState } from "react";
import { getRecentActivity, subscribeToActivity } from "@/lib/platform-stats";
import styles from "./LoggedOutExperience.module.css";

const VERBS = {
  space_published: (event) => `published ${event.space_name ?? "a new Space"}`,
  space_updated: (event) => `updated ${event.space_name ?? "their Space"}`,
  space_entered: (event) => `entered ${event.space_name ?? "a Space"}`,
  account_joined: () => "joined Kobbleston",
};

function describe(event) {
  const verb = VERBS[event.type];
  const name = event.actor_name ?? "Someone";
  return verb ? `${name} ${verb(event)}` : `${name} did something on Kobbleston`;
}

export default function LiveActivityFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getRecentActivity(6).then((data) => {
      if (isMounted) {
        setEvents(data);
        setLoading(false);
      }
    });

    const unsubscribe = subscribeToActivity((newEvent) => {
      setEvents((current) => [newEvent, ...current].slice(0, 6));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <ul className={styles.activityList} aria-busy="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className={`${styles.activityItem} ${styles.activitySkeleton}`} />
        ))}
      </ul>
    );
  }

  if (events.length === 0) {
    return (
      <div className={styles.activityEmpty}>
        <p>It&rsquo;s quiet right now. Be the first thing that happens today.</p>
      </div>
    );
  }

  return (
    <ul className={styles.activityList}>
      {events.map((event) => (
        <li key={event.id} className={styles.activityItem}>
          <span className={styles.activityDot} aria-hidden="true" />
          <span>{describe(event)}</span>
        </li>
      ))}
    </ul>
  );
}
