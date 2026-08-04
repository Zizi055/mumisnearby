import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LkButton from '../../components/ui/LkButton';
import { useVoiceStore } from '../../store/voice.store';
import { getTrialInfo } from '../../store/trial.store';
import { useHasPaidPlan } from '../../store/subscription.store';


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

  const hasPaidPlan = useHasPaidPlan();
  const trial = !hasPaidPlan ? getTrialInfo() : null;
  // В триале — только 1 голос
  const voiceLimitReached = !hasPaidPlan && trial && voices.length >= 1;

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

  // Переименование и загрузка аватарки бьются в эндпоинты, которых пока
  // нет на бэке (PATCH /voices/{id}, POST /voices/{id}/avatar) — держим
  // ошибку в стейте, чтобы показать понятное сообщение вместо тишины.
  const [renameError, setRenameError] =
    useState(null);

  const [avatarError, setAvatarError] =
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

      setAvatarError(null);
    } catch (error) {
      console.error(error);

      setAvatarError(
        'Загрузка фото голоса пока недоступна — эта функция ещё в разработке.'
      );
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
          disabled={voiceLimitReached}
          title={voiceLimitReached ? 'В пробном периоде доступен 1 голос' : undefined}
          onClick={() => {
            if (voiceLimitReached) {
              navigate('/subscription/tariff');
            } else {
              navigate('/voice/manage');
            }
          }}
        >
          <Plus size={16} />

          <span>
            {voiceLimitReached ? 'Лимит голосов' : 'Создать голос'}
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

      {/* Ошибка загрузки аватарки — эндпоинт ещё не реализован на бэке */}
      {avatarError && (
        <div className="lk-voices-trial-hint">
          <span>{avatarError}</span>
          <button
            type="button"
            className="lk-btn lk-btn--sm lk-btn--secondary"
            onClick={() => setAvatarError(null)}
          >
            Понятно
          </button>
        </div>
      )}

      {/* Триал-подсказка */}
      {voiceLimitReached && (
        <div className="lk-voices-trial-hint">
          <span>В пробном периоде доступен только 1 голос.</span>
          <button
            type="button"
            className="lk-btn lk-btn--sm lk-btn--secondary"
            onClick={() => navigate('/subscription/tariff')}
          >
            Расширить доступ
          </button>
        </div>
      )}

      {/* grid */}

      {voices.length > 0 ? (

        <div className="lk-voices__grid">

          {voices.map((voice) => (

            <article
              key={voice.id}
              /* is-menu-open поднимает карточку над соседними: у всех
                 карточек position: relative, и без этого следующая по
                 порядку карточка перекрывала выпадающее меню — нижние
                 пункты («Удалить») просто не было видно. */
              className={`lk-voice-card ${activeMenu === voice.id ? 'is-menu-open' : ''}`}
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

                      setRenameError(
                        null
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
              onClick={() => {
                setRenameVoice(null);
                setRenameError(null);
              }}
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

                {renameError && (
                  <p className="lk-voice-rename-error">
                    {renameError}
                  </p>
                )}

              </div>

              <div className="lk-modal__actions">

                <LkButton
                  onClick={() => {
                    setRenameVoice(null);
                    setRenameError(null);
                  }}
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

                      setRenameError(
                        null
                      );
                    } catch (error) {
                      console.error(
                        error
                      );

                      setRenameError(
                        'Переименование пока недоступно — эта функция ещё в разработке.'
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