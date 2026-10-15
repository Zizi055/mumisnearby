/**
 * Форма заявки.
 *
 * Отправляется в POST /leads — тот же эндпоинт, что у формы на
 * «Родных голосах»; заявки оттуда попадают в админку. Поле source
 * отличает корпоративные обращения от частных.
 */

const ENDPOINT = '/leads';

const MESSAGES = {
  incomplete: 'Укажите имя и хотя бы один способ связи — почту или телефон.',
  failed: 'Не удалось отправить заявку. Попробуйте ещё раз или напишите нам на почту.',
  sent: 'Заявка отправлена. Свяжемся с вами в ближайший рабочий день.',
};

function readValue(form, name) {
  return form.querySelector(`[name="${name}"]`)?.value.trim() ?? '';
}

function setStatus(element, text, state) {
  if (!element) return;

  element.textContent = text;
  element.classList.toggle('is-error', state === 'error');
  element.classList.toggle('is-success', state === 'success');
}

export function initLeadForms(root = document) {
  root.querySelectorAll('[data-lead-form]').forEach((form) => {
    const status = form.querySelector('[data-form-status]');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const payload = {
        name: readValue(form, 'name'),
        email: readValue(form, 'email'),
        phone: readValue(form, 'phone'),
        company: readValue(form, 'company'),
        comment: readValue(form, 'comment'),
        source: form.dataset.leadForm || 'b2b',
      };

      setStatus(status, '', null);

      if (!payload.name || (!payload.email && !payload.phone)) {
        setStatus(status, MESSAGES.incomplete, 'error');
        return;
      }

      if (submit) submit.disabled = true;

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        // Проверяем не только код, но и тип ответа. Если nginx не
        // проксирует /leads на бэкенд, запрос упирается в статику и
        // возвращает 200 с html-страницей — форма отрапортовала бы об
        // успехе, а заявка никуда бы не ушла.
        const isJson = (response.headers.get('content-type') || '').includes('json');
        if (!response.ok || !isJson) throw new Error(`HTTP ${response.status}`);

        form.reset();
        setStatus(status, MESSAGES.sent, 'success');
      } catch {
        setStatus(status, MESSAGES.failed, 'error');
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  });
}
