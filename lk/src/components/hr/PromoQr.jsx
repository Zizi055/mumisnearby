import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// ─────────────────────────────────────────────────────────────────────
// QR-код промокода.
//
// Генерируем в браузере, а не просим картинку у бэкенда: код у нас уже
// есть, а отдельный эндпоинт за PNG — лишний запрос, лишняя ручка и
// лишний повод ей упасть.
//
// В QR кладём не сам код, а ссылку с ним: сотрудник сканирует телефоном и
// сразу попадает на страницу активации с заполненным полем. Если дать
// только текст кода, камера покажет строку, которую придётся
// перепечатывать руками — ровно то, от чего QR и должен избавить.
// ─────────────────────────────────────────────────────────────────────

export function promoActivationUrl(code) {
  return `${window.location.origin}/lk/#/promo?code=${encodeURIComponent(code)}`;
}

export default function PromoQr({ code, size = 160 }) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(promoActivationUrl(code), {
      width: size * 2, // запас под retina
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#2f4f3a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code, size]);

  if (failed) {
    return <div className="lk-hr-qr lk-hr-qr--failed">QR не сформировался</div>;
  }

  if (!src) {
    return <div className="lk-hr-qr lk-hr-qr--loading" style={{ width: size, height: size }} />;
  }

  return (
    <img
      className="lk-hr-qr"
      src={src}
      width={size}
      height={size}
      alt={`QR-код промокода ${code}`}
    />
  );
}
