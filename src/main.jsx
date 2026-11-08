import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, MapPin, Music2, Pause, Play, X } from "lucide-react";
import { gallery, invitation } from "./invitation.js";
import "./styles.css";

const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;

function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!invitation.date) return <div className="countdown-note">Wedding date to be confirmed</div>;
  const remain = Math.max(0, new Date(invitation.date).getTime() - now);
  if (!remain) return <div className="countdown-note">The sacred hour has arrived</div>;
  const parts = [
    ["Days", Math.floor(remain / 86400000)],
    ["Hours", Math.floor((remain / 3600000) % 24)],
    ["Minutes", Math.floor((remain / 60000) % 60)],
    ["Seconds", Math.floor((remain / 1000) % 60)],
  ];
  return <div className="countdown-values">{parts.map(([label, value]) => <div className="count-value" key={label} aria-label={`${label}: ${value}`}><strong>{String(value).padStart(2, "0")}</strong><span className="sr-only">{label}</span></div>)}</div>;
}

function GalleryViewer({ index, onClose, onChange }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onChange((index + gallery.length - 1) % gallery.length);
      if (event.key === "ArrowRight") onChange((index + 1) % gallery.length);
    };
    window.addEventListener("keydown", handleKey);
    document.body.classList.add("modal-open");
    return () => { window.removeEventListener("keydown", handleKey); document.body.classList.remove("modal-open"); };
  }, [index, onChange, onClose]);
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={onClose}>
    <button className="lightbox-close icon-button" aria-label="Close gallery" onClick={onClose}><X /></button>
    <button className="lightbox-arrow prev icon-button" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); onChange((index + gallery.length - 1) % gallery.length); }}><ArrowLeft /></button>
    <img src={asset(gallery[index])} alt={`Wedding gallery photo ${index + 1}`} onClick={(e) => e.stopPropagation()} />
    <button className="lightbox-arrow next icon-button" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); onChange((index + 1) % gallery.length); }}><ArrowRight /></button>
    <div className="lightbox-count">{index + 1} / {gallery.length}</div>
  </div>;
}

function MusicToggle({ audioRef, playing, setPlaying }) {
  if (!invitation.audioFile) return null;
  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { try { await audioRef.current.play(); setPlaying(true); } catch { setPlaying(false); } }
  };
  return <><audio ref={audioRef} src={asset(invitation.audioFile)} loop preload="auto" /><button className="music-toggle" onClick={toggle} aria-label={playing ? "Pause music" : "Play music"}>{playing ? <Pause size={17} /> : <Music2 size={17} />}</button></>;
}

function RSVP() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", attendance: "yes", adults: "1", children: "0", functions: [], note: "" });
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const toggleFunction = (title) => setForm((current) => ({ ...current, functions: current.functions.includes(title) ? current.functions.filter((item) => item !== title) : [...current.functions, title] }));
  const submit = (event) => {
    event.preventDefault();
    const key = "wedding-invitation-rsvps";
    const saved = JSON.parse(localStorage.getItem(key) || "[]");
    saved.push({ ...form, submittedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(saved));
    setSent(true);
  };
  return <section className="section rsvp-section" id="rsvp">
    <div className="section-heading"><span className="eyebrow">Let us know if you can join us, so we may keep a place for you.</span><h2>Bless Us With Your Presence</h2><img src={asset("gold-divider.webp")} alt="" /></div>
    {sent ? <div className="rsvp-success"><span className="success-mark"><Check /></span><h3>Thank you for your reply</h3><p>Your response has been saved on this device.</p><button className="text-button" onClick={() => setSent(false)}>Update response</button></div> :
      <form className="rsvp-form" onSubmit={submit}>
        <div className="attending full-field"><span>Will you join us?</span><div><label><input type="radio" name="attendance" value="yes" checked={form.attendance === "yes"} onChange={update} />With joy, we will be there</label><label><input type="radio" name="attendance" value="no" checked={form.attendance === "no"} onChange={update} />With regret, we cannot</label></div></div>
        <label className="full-field">Name<input name="name" autoComplete="name" required value={form.name} onChange={update} placeholder="Your name" /></label>
        <label>Adults<select name="adults" value={form.adults} onChange={update}>{[1,2,3,4,5,6].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label>Children<select name="children" value={form.children} onChange={update}>{[0,1,2,3,4,5,6].map((n) => <option key={n}>{n}</option>)}</select></label>
        <fieldset className="functions full-field"><legend>Which functions?</legend><div>{invitation.events.map((event) => <label key={event.title}><input type="checkbox" checked={form.functions.includes(event.title)} onChange={() => toggleFunction(event.title)} />{event.title}</label>)}</div></fieldset>
        <label className="full-field">A note for the couple <span className="optional">(optional)</span><textarea name="note" value={form.note} onChange={update} rows="3" placeholder="Write a message" /></label>
        <button className="button button-dark full-field" type="submit">Send your reply <ArrowRight size={16} /></button>
      </form>}
    <p className="privacy-note">Replies are stored in this browser on this device.</p>
  </section>;
}

function App() {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  useEffect(() => {
    document.documentElement.classList.toggle("invitation-locked", !opened);
    document.body.classList.toggle("invitation-locked", !opened);
    return () => {
      document.documentElement.classList.remove("invitation-locked");
      document.body.classList.remove("invitation-locked");
    };
  }, [opened]);
  const openInvitation = () => {
    if (opened || opening) return;
    setOpening(true);
    if (audioRef.current && invitation.audioFile) {
      audioRef.current.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false));
    }
    window.setTimeout(() => {
      setOpened(true);
      setOpening(false);
    }, 600);
  };
  const eventCards = invitation.events;
  return <>
    <MusicToggle audioRef={audioRef} playing={musicPlaying} setPlaying={setMusicPlaying} />
    <div className="page-frame" aria-hidden="true" />
    <section className={`cover ${opened ? "cover-opened" : ""} ${opening ? "cover-opening" : ""}`} aria-label="Wedding invitation cover">
      <div className="cover-art" />
      {opened && <video className="cover-video" autoPlay loop muted playsInline preload="auto" poster={asset("gold-paper-background.png")} aria-hidden="true"><source src={asset("hero-procession-bg-2x-v2.mp4")} type="video/mp4" /></video>}
      <div className="cover-content">
        {opened && <span className="eyebrow">{invitation.auspiciousLine}</span>}
        {!opened && <span className="cover-title">The Wedding Of</span>}
        <h1 className="cover-names"><span>{invitation.groom.name}</span><span className="cover-amp">&amp;</span><span>{invitation.bride.name}</span></h1>
        <p className="cover-date"><span className="cover-date-label">{opened ? <><span className="cover-date-weekday">{invitation.dateWeekday},</span><span className="cover-date-month">{invitation.dateMonth}</span><span className="cover-date-numbers">{invitation.dateDay}, {invitation.dateYear}</span></> : <><span className="cover-date-numbers">{invitation.dateDay}</span><span className="cover-date-month">{invitation.dateMonth}</span><span className="cover-date-numbers">{invitation.dateYear}</span></>}</span>{invitation.locationName && <span className="cover-date-location">at<br />{invitation.locationName}</span>}</p>
        {!opened && <button className="button button-gold" onClick={openInvitation}>Open invitation</button>}
      </div>
      <span className="cover-hint">{opened ? "Scroll to explore" : "Open invitation to continue"}</span>
    </section>

    <main>
      <section className="welcome section" id="welcome">
        <h2>The Couple</h2>
        <p className="welcome-copy">{invitation.coupleLine}</p>
        <div className="couple-grid">{[invitation.groom, invitation.bride].map((person, index) => <React.Fragment key={person.name}><article className={`person-card ${person === invitation.groom ? "person-card-groom" : "person-card-bride"}`}>
          <div className="person-frame">
            <div className="person-photo">{person.image ? <img src={asset(person.image)} alt={`${person.name} portrait`} /> : <img className="person-ornament" src={asset("mandala-gold.webp")} alt="" />}</div>
            <img className="person-frame-art" src={asset("peacock-arch.webp")} alt="" />
          </div>
          <div className="person-details"><h3>{person.name}</h3><span>{person.relation}</span><p>{person.parents}</p></div>
        </article>{index === 0 && <img className="couple-divider" src={asset("couple-divider.webp")} alt="" />}</React.Fragment>)}</div>
      </section>

      <section className="countdown-section" aria-label="Countdown to the wedding">
        <img className="countdown-divider" src={asset("gold-divider.webp")} alt="" />
        <div className="countdown-frame">
          <div className="countdown-card">
            <h2 className="sr-only">Our Muhurtham In</h2>
            <Countdown />
          </div>
        </div>
        <img className="countdown-divider" src={asset("gold-divider.webp")} alt="" />
        {invitation.dateLabel && <p className="date-label countdown-date"><CalendarDays size={16} />{invitation.dateLabel}</p>}
      </section>

      <section className="events-section section" id="events">
        <div className="section-heading"><span className="eyebrow">Walk with us, function to function, to the sacred hour.</span><h2>The Wedding Journey</h2><img src={asset("gold-divider.webp")} alt="" /></div>
        <div className="event-grid">{eventCards.map((event, i) => <article className="event-card" key={i}>
          <img className="event-art" src={asset(event.image)} alt="" />
          <span className="event-number">0{i + 1}</span>
          <h3>{event.title || "Celebration details"}</h3>
          <p>{event.date || "Date to be confirmed"}</p>
          {event.time && <p>{event.time}</p>}
          {event.venue && <p className="event-venue"><MapPin size={14} />{event.venue}</p>}
          {event.mapUrl && <a className="map-link" href={event.mapUrl} target="_blank" rel="noreferrer"><MapPin size={14} />View map</a>}
        </article>)}</div>
        {invitation.locationName && <div className="venue-note"><MapPin size={17} />{invitation.locationName}{invitation.mapUrl && <a href={invitation.mapUrl} target="_blank" rel="noreferrer">Open map <ArrowRight size={14} /></a>}</div>}
      </section>

      <section className="gallery-section section" id="gallery">
        <div className="section-heading"><span className="eyebrow">Little moments from the years that brought us here.</span><h2>Before the Vows</h2><img src={asset("gold-divider.webp")} alt="" /></div>
        {gallery.length ? <div className="gallery-grid">{gallery.map((photo, i) => <button className={`gallery-photo photo-${i % 6}`} key={photo} onClick={() => setActivePhoto(i)} aria-label={`Open photo ${i + 1}`}><img src={asset(photo)} alt={`Wedding moment ${i + 1}`} loading="lazy" /><span className="photo-open">View</span></button>)}</div> : <div className="gallery-empty"><img src={asset("gallery-parasol.png")} alt="" /><p>Your photos will appear here</p></div>}
        <img className="gallery-parasol" src={asset("gallery-parasol.png")} alt="" />
      </section>

      <section className="film-section">
        <div className="film-art"><img src={asset(invitation.videoId ? "maxresdefault.webp" : "video-wall.jpg")} alt="" />
          {invitation.videoId ? <button className="play-film" aria-label="Play wedding film" onClick={() => setShowVideo(true)}><Play fill="currentColor" /></button> : <div className="film-unavailable"><Play fill="currentColor" /><span>Wedding film to be added</span></div>}
        </div>
        <div className="film-caption"><span className="eyebrow">Wedding video</span><h2>A Special Glimpse</h2><p>Our wedding video will appear here when available.</p></div>
      </section>

      <RSVP />

      <footer className="closing-card"><div className="closing-copy"><span className="eyebrow">We await your gracious presence</span><h2>and your blessings</h2><p>శుభమస్తు</p><a href="#welcome" className="back-top">Back to invitation <ChevronDown size={15} /></a></div></footer>
    </main>
    {activePhoto !== null && <GalleryViewer index={activePhoto} onClose={() => setActivePhoto(null)} onChange={setActivePhoto} />}
    {showVideo && <div className="video-modal" role="dialog" aria-modal="true" aria-label="Wedding film" onClick={() => setShowVideo(false)}><button className="lightbox-close icon-button" aria-label="Close video"><X /></button><iframe src={`https://www.youtube-nocookie.com/embed/${invitation.videoId}?autoplay=1&rel=0`} title="Wedding film" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen onClick={(e) => e.stopPropagation()} /></div>}
  </>;
}

createRoot(document.getElementById("root")).render(<App />);
