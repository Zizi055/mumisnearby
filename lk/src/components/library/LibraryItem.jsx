import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useVoiceStore } from '../../store/voice.store';

export default function LibraryItem() {
  const { type, id } = useParams();

  const {
    voices,
    loadVoices,
  } = useVoiceStore();

  const [selectedVoice, setSelectedVoice] =
    useState(null);

  const [isGenerating, setIsGenerating] =
    useState(false);

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    if (
      voices.length > 0 &&
      !selectedVoice
    ) {
      setSelectedVoice(voices[0]);
    }
  }, [voices]);

  const handleGenerate = async () => {
    if (!selectedVoice) return;

    setIsGenerating(true);

    try {
      console.log({
        contentType: type,
        contentId: id,
        voiceId: selectedVoice.id,
      });

      alert(
        'Позже здесь будет генерация через ElevenLabs'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="lk-library-item">

      <div className="lk-library-item__hero">

        <img
          src="https://picsum.photos/1600/600"
          alt="preview"
        />

        <div className="lk-library-item__hero-content">

          <div className="lk-library-item__breadcrumbs">
            Библиотека / Сказки
          </div>

          <h1 className="lk-library-item__title">
            Брат и сестра (Иванушка и Алёнушка)
          </h1>

          <p className="lk-library-item__description">
            Русская народная сказка о любви,
            верности и семейных ценностях.
          </p>

          <div className="lk-library-item__meta">
            <span>Возраст: 5+</span>
            <span>Длительность: 12 мин</span>
            <span>ID: {id}</span>
          </div>

        </div>

      </div>

      <div className="lk-library-item__body">

        <div className="lk-library-item__main">

          <h2>Текст сказки</h2>

          <div className="lk-library-item__text">

            <p>
              Один купец поехал по делам...
            </p>

            <p>
              Здесь позже будет полный текст
              сказки из бэкенда.
            </p>

          </div>

        </div>

        <aside className="lk-library-item__sidebar">

          <div className="lk-library-item__card">

            <h3>Голос рассказчика</h3>

            <div className="lk-library-item__voice-list">

              {voices.map((voice) => (

                <button
                  key={voice.id}
                  type="button"
                  className={`lk-library-item__voice ${
                    selectedVoice?.id ===
                    voice.id
                      ? 'is-active'
                      : ''
                  }`}
                  onClick={() =>
                    setSelectedVoice(voice)
                  }
                >

                  <div className="lk-library-item__voice-avatar">

                    {voice.avatar ? (

                      <img
                        src={voice.avatar}
                        alt={voice.name}
                      />

                    ) : (

                      <span>
                        {voice.name?.[0]}
                      </span>

                    )}

                  </div>

                  <div className="lk-library-item__voice-info">

                    <strong>
                      {voice.name}
                    </strong>

                    <span>
                      {voice.status ===
                      'ready'
                        ? 'Готов'
                        : 'Обучается'}
                    </span>

                  </div>

                </button>

              ))}

            </div>

          </div>

          <div className="lk-library-item__card">

            <h3>Создать аудиосказку</h3>

            <p>
              Выбранный голос:
              {' '}
              {selectedVoice?.name ||
                'не выбран'}
            </p>

            <button
              type="button"
              className="lk-btn lk-btn--primary"
              disabled={
                !selectedVoice ||
                isGenerating
              }
              onClick={handleGenerate}
            >
              {isGenerating
                ? 'Генерация...'
                : 'Сгенерировать аудио'}
            </button>

          </div>

        </aside>

      </div>

    </section>
  );
}