import { jsPDF } from 'jspdf';

export const generateReceipt = async (payment) => {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });


  const res = await fetch(`${import.meta.env.BASE_URL}fonts/Inter-Regular.ttf`);
  const buffer = await res.arrayBuffer();

  const base64Font = btoa(
    new Uint8Array(buffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  doc.addFileToVFS('Inter-Regular.ttf', base64Font);
  doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
  doc.setFont('Inter', 'normal');


  const text = '#111111';
  const gray = '#6B7280';
  const light = '#F3F4F6';
  const border = '#E5E7EB';
  const accent = '#16A34A';

  let y = 60;


  doc.setFontSize(20);
  doc.setTextColor(text);
  doc.text('Чек', 40, y);

  doc.setFontSize(10);
  doc.setTextColor(gray);
  doc.text(`ID: ${payment.id}`, 500, y, { align: 'right' });

  y += 30;

  // статус
  doc.setFillColor(220, 252, 231); // светло-зеленый
  doc.roundedRect(40, y - 10, 90, 22, 6, 6, 'F');

  doc.setFontSize(9);
  doc.setTextColor(accent);
  doc.text('Оплачено', 85, y + 4, { align: 'center' });

  y += 40;


  doc.setFillColor(light);
  doc.roundedRect(40, y, 515, 120, 12, 12, 'F');

  y += 25;

  const row = (label, value) => {
    doc.setFontSize(9);
    doc.setTextColor(gray);
    doc.text(label, 60, y);

    doc.setFontSize(10);
    doc.setTextColor(text);
    doc.text(String(value || '—'), 520, y, { align: 'right' });

    y += 22;
  };

  row('Тариф', payment.title);
  row('Тип операции', payment.type);
  row('Дата', payment.date);
  row('Метод оплаты', payment.method);

  y += 20;


  doc.setFontSize(11);
  doc.setTextColor(text);
  doc.text('Состав платежа', 40, y);

  y += 20;

  payment.items?.forEach((item) => {
    doc.setFontSize(10);

    doc.setTextColor(gray);
    doc.text(item.label, 40, y);

    doc.setTextColor(text);
    doc.text(item.value, 520, y, { align: 'right' });

    y += 18;
  });

  y += 10;

  // линия
  doc.setDrawColor(border);
  doc.line(40, y, 555, y);

  y += 30;

  doc.setFontSize(14);
  doc.setTextColor(text);

  doc.text('Итого', 40, y);

  doc.setFontSize(16);
  doc.text(payment.amount, 520, y, { align: 'right' });

  y += 40;


  doc.setFontSize(9);
  doc.setTextColor(gray);

  doc.text('Сервис: Родные голоса', 40, y);
  y += 14;
  doc.text('support@rodnye-golosa.ru', 40, y);

  doc.save(`receipt-${payment.id}.pdf`);
};