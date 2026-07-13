// VerifyEmail.jsx — страница, на которую должна вести ссылка из письма
// подтверждения: /lk/#/verify-email?token=...
//
// До этой правки такой страницы не было вообще — ссылка из письма никуда
// осмысленного не вела, а фронт не знал, подтвердилась почта или нет.

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, XCircle } from 'lucide-react';
import { verifyEmail } from '../api/auth.service';
import { initTrial } from '../store/trial.store';
import AuthDNA from './AuthDNA';
import '../styles/scss/pages/auth.scss';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState(token ? 'loading' : 'error');
  const [error, setError] = useState(token ? '' : 'В ссылке нет токена подтверждения.');

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => {
        // Триал стартует именно тут, при подтверждении почты, а не при
        // регистрации — раньше initTrial() вызывался сразу после
        // регистрации и мог начинать отсчёт до того, как человек вообще
        // получил доступ к аккаунту.
        initTrial();
        setStatus('success');
      })
      .catch((e) => {
        setStatus('error');
        setError(e.message || 'Не получилось подтвердить почту.');
      });
  }, [token]);

  return (
    <div className="auth">
      <div className="auth__left">
        <AuthDNA />
        <div className="auth__left-content">
          <div className="auth__brand">Родные голоса</div>
          <div className="auth__tagline">
            <h1>Голос близких —<br />в каждой сказке</h1>
          </div>
        </div>
      </div>

      <div className="auth__right">
        <div className="auth__card">
          {status === 'loading' && (
            <div className="auth__verify-loading">
              <span className="auth__spinner" />
              <p>Подтверждаем почту…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="auth__reset-success">
              <div className="auth__reset-success__icon">
                <MailCheck size={32} />
              </div>
              <h2>Почта подтверждена</h2>
              <p>Теперь можно войти в личный кабинет.</p>
              <button
                type="button"
                className="auth__submit"
                onClick={() => navigate('/auth')}
              >
                Войти
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="auth__verify-error">
              <div className="auth__reset-success__icon">
                <XCircle size={32} />
              </div>
              <h2>Не получилось подтвердить</h2>
              <p>{error}</p>
              <button
                type="button"
                className="auth__submit"
                onClick={() => navigate('/auth')}
              >
                Вернуться ко входу
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
