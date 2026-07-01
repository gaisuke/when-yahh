"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

// Adjust this to whenever/wherever you're actually meeting.
const TARGET_DATE = new Date("2026-07-04T05:00:00+07:00");

function getCountdown() {
  const diff = Math.max(0, TARGET_DATE.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function DigitBox({ value, digits = 2 }) {
  const str = String(value).padStart(digits, "0");
  return (
    <div className="odometer-digits">
      {str.split("").map((char, i) => (
        <span className="odometer-digit" key={i}>
          {char}
        </span>
      ))}
    </div>
  );
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function ShareButton({ person, label, color, current, onShared }) {
  const [status, setStatus] = useState("idle"); // idle | loading | error

  const handleClick = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              person,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          if (!res.ok) throw new Error("request failed");
          const data = await res.json();
          onShared(data);
          setStatus("idle");
        } catch {
          setStatus("error");
        }
      },
      () => setStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [person, onShared]);

  const statusText =
    status === "loading"
      ? "getting location…"
      : status === "error"
        ? "couldn't get location — try again"
        : current
          ? `last shared ${new Date(current.updatedAt).toLocaleTimeString()}`
          : "not shared yet";

  return (
    <button
      className="share-btn"
      style={{ "--dot-color": color }}
      onClick={handleClick}
      disabled={status === "loading"}
    >
      <span className="dot" />
      <span className="share-btn-meta">
        <span className="share-btn-name">Share {label} location</span>
        <span className="share-btn-status">{statusText}</span>
      </span>
    </button>
  );
}

export default function Home() {
  const [countdown, setCountdown] = useState(getCountdown());
  const [locations, setLocations] = useState({ me: null, wife: null });

  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  const refreshLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/location", { cache: "no-store" });
      const data = await res.json();
      setLocations({ me: data.me || null, wife: data.wife || null });
    } catch {
      // ignore — will retry on next poll
    }
  }, []);

  useEffect(() => {
    refreshLocations();
    const t = setInterval(refreshLocations, 8000);
    return () => clearInterval(t);
  }, [refreshLocations]);

  const distanceKm =
    locations.me && locations.wife
      ? haversineKm(locations.me, locations.wife)
      : null;

  const isToday = countdown.days === 0 && countdown.hours < 24 && TARGET_DATE > new Date(0);

  return (
    <main className="wrap">
      <p className="eyebrow">600km apart · closing in</p>
      <h1 className="headline">
        {countdown.days > 0 ? (
          <>
            Dani & Pipit -- <strong>{countdown.days}</strong> day{countdown.days === 1 ? "" : "s"} until we're
            back in the same room.
          </>
        ) : (
          <>Today's the day. See you at the house.</>
        )}
      </h1>

      <div className="odometer">
        <div className="odometer-unit">
          <DigitBox value={countdown.days} digits={3} />
          <span className="odometer-label">Days</span>
        </div>
        <div className="odometer-unit">
          <DigitBox value={countdown.hours} />
          <span className="odometer-label">Hours</span>
        </div>
        <div className="odometer-unit">
          <DigitBox value={countdown.minutes} />
          <span className="odometer-label">Minutes</span>
        </div>
        <div className="odometer-unit">
          <DigitBox value={countdown.seconds} />
          <span className="odometer-label">Seconds</span>
        </div>
      </div>

      <div className="panel">
        <p className="panel-title">Share where you are</p>
        <div className="share-row">
          <ShareButton
            person="me"
            label="Dani's"
            color="#4ECDC4"
            current={locations.me}
            onShared={(data) =>
              setLocations({ me: data.me || null, wife: data.wife || null })
            }
          />
          <ShareButton
            person="wife"
            label="Pipit's"
            color="#FF6B6B"
            current={locations.wife}
            onShared={(data) =>
              setLocations({ me: data.me || null, wife: data.wife || null })
            }
          />
        </div>
      </div>

      <div className="panel">
        <p className="panel-title">Where you both are</p>
        <MapView me={locations.me} wife={locations.wife} />
        <div className="distance-readout">
          <span className="label">Distance apart</span>
          <span className="value">
            {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "— km"}
          </span>
        </div>
      </div>

      {/* No need footnote
      <p className="footnote">
        Open this page on both phones and tap "share." It polls every 8 seconds,
        so the map updates on its own — no refresh needed. The bus ride is
        roughly <strong>7 hours</strong>; this page doesn't know that yet, but
        the distance readout above is doing the same math your driver is.
      </p>
      */}
    </main>
  );
}
