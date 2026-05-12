export function filterLibraryItems(items, filters) {
  return items.filter((item) => {
    const ageMatch =
      !filters.age.length ||
      filters.age.includes(item.age);

    const durationMatch =
      !filters.duration.length ||
      filters.duration.some((durationId) =>
        checkDuration(item.duration, durationId)
      );

    const emotionsMatch =
      !filters.emotions.length ||
      filters.emotions.some((emotion) =>
        item.emotions.includes(emotion)
      );

    const themesMatch =
      !filters.themes.length ||
      filters.themes.some((theme) =>
        item.themes.includes(theme)
      );

    const searchMatch =
      !filters.search ||
      item.title
        .toLowerCase()
        .includes(filters.search.toLowerCase());

    const typeMatch =
      !filters.type ||
      item.type === filters.type;

    return (
      ageMatch &&
      durationMatch &&
      emotionsMatch &&
      themesMatch &&
      searchMatch &&
      typeMatch
    );
  });
}

function checkDuration(duration, durationId) {
  switch (durationId) {
    case 'under-7':
      return duration < 7;

    case '7-14':
      return duration >= 7 && duration <= 14;

    case '14-21':
      return duration >= 14 && duration <= 21;

    case 'over-20':
      return duration >= 20;

    default:
      return true;
  }
}