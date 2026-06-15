export const imageAssets = {
  keychain: [
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.51.jpeg',
      label: 'Purple keychain',
      src: new URL('../assests/Keychain/WhatsApp Image 2026-06-13 at 21.45.51.jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.52 (2).jpeg',
      label: 'Keychain bundle',
      src: new URL('../assests/Keychain/WhatsApp Image 2026-06-13 at 21.45.52 (2).jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.52.jpeg',
      label: 'Gift keychain set',
      src: new URL('../assests/Keychain/WhatsApp Image 2026-06-13 at 21.45.52.jpeg', import.meta.url).href,
    },
  ],
  ringalbum: [
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.54 (1).jpeg',
      label: 'Floral ring album',
      src: new URL('../assests/Ringalbum/WhatsApp Image 2026-06-13 at 21.45.54 (1).jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.54.jpeg',
      label: 'Elegant ring album',
      src: new URL('../assests/Ringalbum/WhatsApp Image 2026-06-13 at 21.45.54.jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.55 (1).jpeg',
      label: 'Rose cover album',
      src: new URL('../assests/Ringalbum/WhatsApp Image 2026-06-13 at 21.45.55 (1).jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.55.jpeg',
      label: 'Vintage ring album',
      src: new URL('../assests/Ringalbum/WhatsApp Image 2026-06-13 at 21.45.55.jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.57.jpeg',
      label: 'Romantic album cover',
      src: new URL('../assests/Ringalbum/WhatsApp Image 2026-06-13 at 21.45.57.jpeg', import.meta.url).href,
    },
  ],
  frame: [
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.58 (1).jpeg',
      label: 'Handmade frame 1',
      src: new URL('../assests/Frames/WhatsApp Image 2026-06-13 at 21.45.58 (1).jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.58.jpeg',
      label: 'Handmade frame 2',
      src: new URL('../assests/Frames/WhatsApp Image 2026-06-13 at 21.45.58.jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.45.59.jpeg',
      label: 'Decorative frame',
      src: new URL('../assests/Frames/WhatsApp Image 2026-06-13 at 21.45.59.jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.46.00 (1).jpeg',
      label: 'Premium frame',
      src: new URL('../assests/Frames/WhatsApp Image 2026-06-13 at 21.46.00 (1).jpeg', import.meta.url).href,
    },
    {
      key: 'WhatsApp Image 2026-06-13 at 21.46.00.jpeg',
      label: 'Classic photo frame',
      src: new URL('../assests/Frames/WhatsApp Image 2026-06-13 at 21.46.00.jpeg', import.meta.url).href,
    },
  ],
};

export const getImageUrl = (categorySlug, imageKey) => {
  const group = imageAssets[categorySlug];
  if (!group) return '';
  const item = group.find((entry) => entry.key === imageKey);
  return item?.src || '';
};

export const getImageOptions = (categorySlug) => {
  return imageAssets[categorySlug] || [];
};
