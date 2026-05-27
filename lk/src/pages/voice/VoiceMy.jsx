import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LkButton from '../../components/ui/LkButton';
import { useVoiceStore } from '../../store/voice.store';


import {
  Download,
  Edit3,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';



export default function VoiceMy() {
  const navigate = useNavigate();

  const {
    voices,
    loadVoices,
    updateVoice,
    removeVoice,
    renameVoiceById,
    uploadAvatar,
  } = useVoiceStore();

  const avatarInputRef = useRef(null);

  const selectedVoiceIdRef =
    useRef(null);

  const audioRef = useRef(null);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const [renameVoice, setRenameVoice] =
    useState(null);

  const [renameValue, setRenameValue] =
    useState('');

  const [deleteVoice, setDeleteVoice] =
    useState(null);

  const [playingVoiceId, setPlayingVoiceId] =
    useState(null);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    const handleClick = () =>
      setActiveMenu(null);

    window.addEventListener(
      'click',
      handleClick
    );

    return () => {
      window.removeEventListener(
        'click',
        handleClick
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleAvatarUpload = async (
    e
  ) => {
    const file = e.target.files?.[0];

    const voiceId =
      selectedVoiceIdRef.current;

    if (!file || !voiceId) return;

    try {
      await uploadAvatar(
        voiceId,
        file
      );
    } catch (error) {
      console.error(error);
    }

    e.target.value = '';

    selectedVoiceIdRef.current = null;
  };

  const handlePlay = (voice) => {
    if (
      !voice.audio ||
      voice.status === 'training'
    ) {
      return;
    }

    if (
      audioRef.current &&
      playingVoiceId === voice.id
    ) {
      audioRef.current.pause();

      audioRef.current = null;

      setPlayingVoiceId(null);

      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(
      voice.audio
    );

    audioRef.current = audio;

    audio.addEventListener(
      'ended',
      () => {
        setPlayingVoiceId(null);
      }
    );

    audio.play();

    setPlayingVoiceId(voice.id);
  };

  return (
    <section className="lk-voices">

      {/* upload avatar */}

      <input
        type="file"
        accept="image/*"
        ref={avatarInputRef}
        style={{ display: 'none' }}
        onChange={
          handleAvatarUpload
        }
      />

      {/* head */}

      <div className="lk-voices__head">

        <div>

          <h2 className="lk-title">
            Мои голоса
          </h2>

          <p className="lk-text">
            Управляйте сохранёнными
            голосовыми моделями.
          </p>

        </div>

        <LkButton
          variant="secondary"
          size="sm"
          className="lk-btn--icon"
          onClick={() =>
            navigate('/voice/manage')
          }
        >
          <Plus size={16} />

          <span>
            Создать голос
          </span>
        </LkButton>

      </div>

      {/* hero */}

      <div className="lk-voices-hero">

        <div>

          <span className="lk-voices-hero__eyebrow">
            Голосовые модели
          </span>

          <h3>
            Ваши родные интонации —
            в одном месте
          </h3>

          <p>
            Здесь хранятся созданные
            голосовые двойники.
            Вы можете прослушивать,
            управлять доступом и
            использовать их
            в сказках,
            колыбельных
            и сценариях.
          </p>

        </div>

        <div className="lk-voices-hero__status">

          <ShieldCheck size={16} />

          <span>
            {
              voices.filter(
                (v) =>
                  v.status === 'ready'
              ).length
            }{' '}
            модели готовы
          </span>

        </div>

      </div>

      {/* grid */}

      {voices.length > 0 ? (

        <div className="lk-voices__grid">

          {voices.map((voice) => (

            <article
              key={voice.id}
              className="lk-voice-card"
            >

              {/* top */}

              <div className="lk-voice-card__top">

                <div className="lk-voice-card__avatar">

                  {voice.avatar ? (

                    <img
                      src={voice.avatar}
                      alt={voice.name}
                    />

                  ) : (

                    <span>
                      {voice.name
                        ?.slice(0, 1)
                        ?.toUpperCase()}
                    </span>

                  )}

                </div>

                <div className="lk-voice-card__actions">

                  <button
                    type="button"
                    className="lk-voice-card__play"
                    onClick={() =>
                      handlePlay(voice)
                    }
                  >
                    {playingVoiceId ===
                    voice.id ? (
                      <Pause size={15} />
                    ) : (
                      <Play size={15} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="lk-voice-card__more"
                    onClick={(e) => {
                      e.stopPropagation();

                      setActiveMenu(
                        activeMenu ===
                          voice.id
                          ? null
                          : voice.id
                      );
                    }}
                  >
                    <MoreHorizontal
                      size={16}
                    />
                  </button>

                </div>

              </div>

              {/* wave */}

              <div className="lk-voice-wave">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>

              {/* progress */}

              {voice.status ===
                'training' && (
                <div className="lk-voice-progress" />
              )}

              {/* body */}

              <div className="lk-voice-card__body">

                <div>

                  <h3>
                    {voice.name}
                  </h3>

                  <p>
                    {voice.description}
                  </p>

                </div>

                <span
                  className={`lk-voice-status is-${voice.status}`}
                >
                  {voice.status ===
                  'training'
                    ? 'Обучается'
                    : voice.status ===
                        'error'
                      ? 'Ошибка'
                      : 'Готова'}
                </span>

              </div>

              {/* footer */}

              <div className="lk-voice-card__footer">

                <span>
                  Создано
                </span>

                <strong>
                  {voice.createdAt}
                </strong>

              </div>

              {/* dropdown */}

              {activeMenu ===
                voice.id && (

                <div
                  className="lk-voice-dropdown"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >

                  <button
                    type="button"
                    onClick={() => {
                      selectedVoiceIdRef.current =
                        voice.id;

                      avatarInputRef.current.click();
                    }}
                  >
                    <Upload size={16} />

                    Загрузить фото
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handlePlay(voice)
                    }
                  >
                    {playingVoiceId ===
                    voice.id ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}

                    {playingVoiceId ===
                    voice.id
                      ? 'Пауза'
                      : 'Воспроизвести'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRenameVoice(
                        voice
                      );

                      setRenameValue(
                        voice.name
                      );

                      setActiveMenu(
                        null
                      );
                    }}
                  >
                    <Edit3 size={16} />

                    Переименовать
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const link =
                        document.createElement(
                          'a'
                        );

                      link.href =
                        voice.audio;

                      link.download = `${voice.name}.mp3`;

                      link.click();

                      setActiveMenu(
                        null
                      );
                    }}
                  >
                    <Download size={16} />

                    Скачать
                  </button>

                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      setDeleteVoice(
                        voice
                      );

                      setActiveMenu(
                        null
                      );
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

          <h3>
            Голосов пока нет
          </h3>

          <p>
            Создайте первый
            голосовой двойник
          </p>

          <LkButton
            variant="primary"
            size="sm"
            onClick={() =>
              navigate('/voice/manage')
            }
          >
            Создать голос
          </LkButton>

        </div>

      )}

      {/* rename modal */}

      {renameVoice && (

        <div className="lk-modal-wrap">

          <div className="lk-modal">

            <div
              className="lk-modal__overlay"
              onClick={() =>
                setRenameVoice(null)
              }
            />

            <div className="lk-modal__content">

              <h3>
                Переименовать голос
              </h3>

              <div className="lk-input-wrap">

                <input
                  value={renameValue}
                  onChange={(e) =>
                    setRenameValue(
                      e.target.value
                    )
                  }
                  className="lk-input"
                />

              </div>

              <div className="lk-modal__actions">

                <LkButton
                  onClick={() =>
                    setRenameVoice(null)
                  }
                >
                  Отмена
                </LkButton>

                <LkButton
                  variant="primary"
                  onClick={async () => {
                    try {
                      await renameVoiceById(
                        renameVoice.id,
                        renameValue
                      );

                      setRenameVoice(
                        null
                      );
                    } catch (error) {
                      console.error(
                        error
                      );
                    }
                  }}
                >
                  Сохранить
                </LkButton>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* delete modal */}

      {deleteVoice && (

        <div className="lk-modal-wrap">

          <div className="lk-modal">

            <div
              className="lk-modal__overlay"
              onClick={() =>
                setDeleteVoice(null)
              }
            />

            <div className="lk-modal__content">

              <h3>
                Удалить голос?
              </h3>

              <p>
                Это действие нельзя
                отменить.
              </p>

              <div className="lk-modal__actions">

                <LkButton
                  onClick={() =>
                    setDeleteVoice(null)
                  }
                >
                  Отмена
                </LkButton>

                <LkButton
                  variant="danger"
                  onClick={async () => {
                    try {
                      await removeVoice(
                        deleteVoice.id
                      );

                      setDeleteVoice(
                        null
                      );
                    } catch (error) {
                      console.error(
                        error
                      );
                    }
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