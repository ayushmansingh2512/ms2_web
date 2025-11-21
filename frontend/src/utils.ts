export const getImageUrl = (url?: string): string => {
  if (!url) {
    return 'https://via.placeholder.com/300?text=No+Image';
  }
  if (url.startsWith('http')) {
    return url;
  }
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return `${baseUrl}${url}`;
};
