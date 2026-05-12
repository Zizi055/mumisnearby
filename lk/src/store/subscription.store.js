const STORAGE_KEY = 'lk_subscription';


function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function write(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // триггерим обновление
  window.dispatchEvent(new Event('subscription:updated'));
}

/* ------------------ API ------------------ */

export function getSubscription() {
  return read();
}

export function updateSubscription(patch) {
  const current = read();

  const next = {
    ...current,
    ...patch,
  };

  write(next);
  return next;
}

export function addPayment(payment) {
  const current = read();

  const next = {
    ...current,
    payments: [payment, ...(current.payments || [])],
    currentPlanId: payment.planId,
  };

  write(next);
  return next;
}