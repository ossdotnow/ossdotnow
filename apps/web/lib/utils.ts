export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
