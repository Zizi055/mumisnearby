import { useParams } from 'react-router-dom';

export default function LibraryItem() {
  const { type, id } = useParams();

  return (
    <section className="lk-library-item">

      <div className="lk-library-item__hero">
        <img
          src="https://picsum.photos/1200/500"
          alt="preview"
        />
      </div>

      <div className="lk-library-item__content">

        <div className="lk-library-item__meta">
          <span>{type}</span>
          <span>ID: {id}</span>
        </div>

        <h1 className="lk-library-item__title">
          Название сказки
        </h1>

        <p className="lk-library-item__description">
          Здесь будет описание сказки,
          колыбельной или терапевтической истории.
        </p>

        <div className="lk-library-item__text">
          <p>
            Здесь позже будет полный текст
            произведения, который придёт
            с бэкенда.
          </p>

          <p>
            Пока страница нужна только
            для проверки навигации.
          </p>
        </div>

        <div className="lk-library-item__actions">

          <button
            type="button"
            className="lk-btn lk-btn--secondary"
          >
            Выбрать голос
          </button>

          <button
            type="button"
            className="lk-btn lk-btn--primary"
          >
            Сгенерировать аудио
          </button>

        </div>

      </div>

    </section>
  );
}