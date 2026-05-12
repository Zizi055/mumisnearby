import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LkButton from '../../components/ui/LkButton';
import { useVoiceStore } from '../../store/voice.store';
import {
  Plus,
  Play,
  MoreHorizontal,
  ShieldCheck,
  Edit3,
  Download,
  Trash2,
   Upload,
} from 'lucide-react';



export default function VoiceMy() {
  const navigate = useNavigate();
  const {
  voices,
  addVoice,
  updateVoice,
  removeVoice,
} = useVoiceStore();
  const avatarInputRef = useRef(null);
const selectedVoiceIdRef = useRef(null);

  const [activeMenu, setActiveMenu] = useState(null);

  const [renameVoice, setRenameVoice] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteVoice, setDeleteVoice] = useState(null);
  const [audio, setAudio] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    const handleClick = () => setActiveMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);
  const handleAvatarUpload = (e) => {
  const file = e.target.files?.[0];
  const voiceId = selectedVoiceIdRef.current;

  if (!file || !voiceId) return;

  const avatarUrl = URL.createObjectURL(file);

 updateVoice(voiceId, {
  avatar: avatarUrl,
});

  e.target.value = '';
  selectedVoiceIdRef.current = null;
};
 const handleUpload = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const newVoiceId = Date.now();

  addVoice({
    id: newVoiceId,
    name: file.name.replace(/\.(mp3|wav|m4a)$/i, ''),
    description: 'Модель обучается',
    status: 'training',
    createdAt: new Date().toLocaleDateString(),
    audio: URL.createObjectURL(file),
    avatar: '',
  });

  setTimeout(() => {
    updateVoice(newVoiceId, {
      status: 'ready',
      description: 'Голосовая модель готова',
    });
  }, 4000);

  e.target.value = '';
};

  return (
    <section className="lk-voices">
          {/* загрузка фото */}
      <input

  type="file"

  accept="image/*"

  ref={avatarInputRef}

  style={{ display: 'none' }}

  onChange={handleAvatarUpload}

/>
      {/* загрузка аудио */}
      <input
        type="file"
        accept="audio/*"
        ref={fileRef}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />

      <div className="lk-voices__head">
        <div>
          <h2 className="lk-title">Мои голоса</h2>
          <p className="lk-text">
            Управляйте сохранёнными голосовыми моделями.
          </p>
        </div>

        <LkButton
          variant="secondary"
          size="sm"
          className="lk-btn--icon"
          onClick={() => fileRef.current.click()}
        >
          <Plus size={16} style={{ opacity: 0.8 }} />
          <span>Новый голос</span>
        </LkButton>
      </div>

      <div className="lk-voices-hero">
        <div>
          <span className="lk-voices-hero__eyebrow">
            Голосовые модели
          </span>
          <h3>Ваши родные интонации — в одном месте</h3>
          <p>
            Здесь хранятся созданные голосовые двойники. Вы можете прослушивать,
            управлять доступом и использовать их в сказках, колыбельных и сценариях.
          </p>
        </div>

        <div className="lk-voices-hero__status">
          <ShieldCheck size={16} />
          <span>{voices.length} модели готовы</span>
        </div>
      </div>

      {voices.length > 0 ? (
        <div className="lk-voices__grid">
          {voices.map((voice) => (
            <article key={voice.id} className="lk-voice-card">
              <div className="lk-voice-card__top">
                <div className="lk-voice-card__avatar">

  {voice.avatar ? (

    <img src={voice.avatar} alt={voice.name} />

  ) : (

    <span>{voice.name.slice(0, 1)}</span>

  )}

</div>

                <div className="lk-voice-card__actions">
                  <button
                    type="button"
                    className="lk-voice-card__play"
                    onClick={() => {
                      if (audio) audio.pause();

                      const newAudio = new Audio(voice.audio);
                      newAudio.play();
                      setAudio(newAudio);
                    }}
                  >
                    <Play size={15} />
                  </button>

                  <button
                    type="button"
                    className="lk-voice-card__more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(
                        activeMenu === voice.id ? null : voice.id
                      );
                    }}
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>

              {/* waveform */}
              <div className="lk-voice-wave">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              {voice.status === 'training' && (
                <div className="lk-voice-progress" />
              )}

              <div className="lk-voice-card__body">
                <div>
                  <h3>{voice.name}</h3>
                  <p>{voice.description}</p>
                </div>

                <span
                  className={`lk-voice-status is-${voice.status}`}
                >
                  {voice.status === 'training'
                    ? 'Обучается'
                    : 'Готова'}
                </span>
              </div>

              <div className="lk-voice-card__footer">
                <span>Создано</span>
                <strong>{voice.createdAt}</strong>
              </div>

              {activeMenu === voice.id && (
                <div
                  className="lk-voice-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
<button

  type="button"

  onClick={() => {

    selectedVoiceIdRef.current = voice.id;

    avatarInputRef.current.click();

  }}

>

  <Upload size={16} />

  Загрузить фото

</button>
                  <button
                  type="button"
                    onClick={() => {
                      if (audio) audio.pause();
                      const newAudio = new Audio(voice.audio);
                      newAudio.play();
                      setAudio(newAudio);
                    }}
                  >
                    <Play size={16} />
                    Воспроизвести
                  </button>

                  <button
                  type="button"
                    onClick={() => {
                      setRenameVoice(voice);
                      setRenameValue(voice.name);
                      setActiveMenu(null);
                    }}
                  >
                    <Edit3 size={16} />
                    Переименовать
                  </button>

                  <button
                  type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = voice.audio;
                      link.download = `${voice.name}.mp3`;
                      link.click();
                      setActiveMenu(null);
                    }}
                  >
                    <Download size={16} />
                    Скачать
                  </button>

                  <button
                  type="button"
                    className="is-danger"
                    onClick={() => {
                      setDeleteVoice(voice);
                      setActiveMenu(null);
                    }}
                  >
                    <Trash2 size={16} />
                    Удалить
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="lk-voices-empty">
          <h3>Голосов пока нет</h3>
          <p>Создайте первый голос</p>

          <LkButton
            variant="primary"
            size="sm"
            onClick={() => fileRef.current.click()}
          >
            Создать голос
          </LkButton>
        </div>
      )}

      {/* rename */}
      {renameVoice && (
        <div className="lk-modal-wrap">
        <div className="lk-modal">
          <div
            className="lk-modal__overlay"
            onClick={() => setRenameVoice(null)}
          />
          <div className="lk-modal__content">
            <h3>Переименовать голос</h3>

           <div className="lk-input-wrap">
           <input
              value={renameValue}
              onChange={(e) =>
                setRenameValue(e.target.value)
              }
              className="lk-input"
            />
            </div> 

            <div className="lk-modal__actions">
              <LkButton onClick={() => setRenameVoice(null)}>
                Отмена
              </LkButton>

          <LkButton

  variant="primary"

  onClick={() => {

    updateVoice(renameVoice.id, {

      name: renameValue,

    });

    setRenameVoice(null);

  }}

>

  Сохранить

</LkButton>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* delete */}
      {deleteVoice && (
         <div className="lk-modal-wrap">
        <div className="lk-modal">
          <div
            className="lk-modal__overlay"
            onClick={() => setDeleteVoice(null)}
          />
          <div className="lk-modal__content">
            <h3>Удалить голос?</h3>

            <div className="lk-modal__actions">
              <LkButton onClick={() => setDeleteVoice(null)}>
                Отмена
              </LkButton>

              <LkButton
  variant="danger"
  onClick={() => {
    removeVoice(deleteVoice.id);
    setDeleteVoice(null);
  }}
>
  Удалить
</LkButton>
            </div>
          </div>
        </div>
        </div>
      )}
    </section>
  );
}