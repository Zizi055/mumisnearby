import { useRef, useState } from 'react';

export default function VoiceManage() {
  const [volume, setVolume] = useState(70);
  const [speed, setSpeed] = useState(1);
  const fileRef = useRef(null);

  return (
    <div className="lk-voice">
      <div className="lk-voice-head">
        <div>
          <h2 className="lk-title">Управление голосом</h2>
          <p className="lk-text">Загрузите запись, настройте мягкость и темп звучания.</p>
        </div>
      </div>

      <div className="lk-upload" onClick={() => fileRef.current.click()}>
        <input ref={fileRef} type="file" hidden />
        <div>Перетащите аудио или нажмите для загрузки</div>
      </div>

      <div className="lk-card lk-voice-settings">
        <Range label="Громкость" value={volume} onChange={setVolume} />
        <Range label="Скорость" value={speed} min={0.5} max={2} step={0.1} onChange={setSpeed} />
      </div>

      <div className="lk-actions">
        <button className="lk-btn-primary">Сохранить настройки</button>
        <button className="lk-btn-secondary">Сбросить</button>
      </div>
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
        className="lk-setting__range"
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