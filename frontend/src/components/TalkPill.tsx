"use client";

import { useEffect, useState } from "react";

/** Floating "Talk to the robot" button; appears once the hero has scrolled out of view. */
export function TalkPill() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const go = (): void => {
    document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    document.getElementById("message")?.focus({ preventScroll: true });
  };

  return (
    <button type="button" className="talk-pill" data-show={show} tabIndex={show ? 0 : -1} aria-hidden={!show} onClick={go}>
      Talk to the robot
    </button>
  );
}
