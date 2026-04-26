import { useRef, useState } from 'react';

export default function VoiceMy() {
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  const voices = [
    { id: 1, name: 'Мамин голос', file: '/audio/sample.mp3' },
    { id: 2, name: 'Папин голос', file: '/audio/sample.mp3' },
  ];

  const handlePlay = (voice) => {
    if (playingId === voice.id) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    audioRef.current.src = voice.file;
    audioRef.current.play();
    setPlayingId(voice.id);
  };

  return (
    <div className="lk-voice">
      <audio ref={audioRef} />

      <div className="lk-voice-head">
        <div>
          <h2 className="lk-title">Мои голоса</h2>
          <p className="lk-text">Управляйте сохранёнными голосовыми моделями.</p>
        </div>

        <button className="lk-btn-primary">+ Новый голос</button>
      </div>

      <div className="lk-voice-grid">
        {voices.map((voice) => (
          <div key={voice.id} className="lk-card lk-voice-card">
            <div className="lk-voice-wave" />

            <button
              type="button"
              className="lk-voice-play"
              onClick={() => handlePlay(voice)}
            >
              {playingId === voice.id ? '⏸' : '▶'}
            </button>

            <div className="lk-voice-card__name">{voice.name}</div>
            <div className="lk-card__label">Голосовая модель готова</div>
          </div>
        ))}
      </div>
    </div>
  );
}