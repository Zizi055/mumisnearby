import { useLocation, useRef, useState } from 'react';

export default function Voice() {
  const location = useLocation();
  const page = location.pathname.split('/').pop();

  return (
    <section className="lk-page lk-page--voice">
      <div className="lk-page__inner">
        {page === 'my' && <VoiceMy />}
        {page === 'manage' && <VoiceManage />}
        {page === 'analytics' && <VoiceAnalytics />}
      </div>
    </section>
  );
}

/* ===================== MY ===================== */

function VoiceMy() {
  const [playingId, setPlayingId] = useState(null);

  const voices = [
    { id: 1, name: 'Мамин голос', file: '/audio/sample.mp3' },
    { id: 2, name: 'Папин голос', file: '/audio/sample.mp3' },
  ];

  const audioRef = useRef(null);

  const handlePlay = (voice) => {
    if (playingId === voice.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = voice.file;
      audioRef.current.play();
      setPlayingId(voice.id);
    }
  };

  return (
    <div className="lk-voice">

      <audio ref={audioRef} />

      <div className="lk-voice-head">
        <h2 className="lk-title">Мои голоса</h2>
        <button className="lk-btn-primary">+ Новый голос</button>
      </div>

      <div className="lk-voice-grid">
        {voices.map((v) => (
          <div key={v.id} className="lk-card lk-voice-card">

            <div className="lk-voice-wave" />

            <button
              className="lk-voice-play"
              onClick={() => handlePlay(v)}
            >
              {playingId === v.id ? '⏸' : '▶'}
            </button>

            <div className="lk-voice-card__name">{v.name}</div>

          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== MANAGE ===================== */

function VoiceManage() {
  const [volume, setVolume] = useState(70);
  const [speed, setSpeed] = useState(1);
  const fileRef = useRef();

  return (
    <div className="lk-voice">

      <h2 className="lk-title">Создание голоса</h2>

      {/* Upload */}
      <div
        className="lk-upload"
        onClick={() => fileRef.current.click()}
      >
        <input type="file" ref={fileRef} hidden />
        <div>Перетащите аудио или нажмите</div>
      </div>

      {/* Record */}
      <button className="lk-btn-secondary">🎙 Записать голос</button>

      {/* Settings */}
      <div className="lk-card lk-voice-settings">

        <Range label="Громкость" value={volume} onChange={setVolume} />
        <Range label="Скорость" value={speed} step={0.1} min={0.5} max={2} onChange={setSpeed} />

      </div>

    </div>
  );
}

/* ===================== ANALYTICS ===================== */

function VoiceAnalytics() {
  return (
    <div className="lk-voice">

      <h2 className="lk-title">Аналитика</h2>

      <div className="lk-kpi">
        <Kpi title="Прослушивания" value="1 240" />
        <Kpi title="Удержание" value="78%" />
        <Kpi title="Среднее время" value="6 мин" />
      </div>

      <div className="lk-card lk-chart">
        <div className="lk-chart__fake" />
      </div>

    </div>
  );
}

/* ===================== UI ===================== */

function Kpi({ title, value }) {
  return (
    <div className="lk-card lk-card--accent">
      <div className="lk-card__value">{value}</div>
      <div className="lk-card__label">{title}</div>
    </div>
  );
}

function Range({ label, value, onChange, min = 0, max = 100, step = 1 }) {
  return (
    <div className="lk-setting">
      <div className="lk-setting__row">
        <span>{label}</span>
        <span>{value}</span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}