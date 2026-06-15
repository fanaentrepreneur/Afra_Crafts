export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getProductImageUrl = (product) => {
  if (product.subImages?.length > 0) return product.subImages[0];
  if (product.imageData) return product.imageData;
  if (product.imageUrl) return product.imageUrl;
  return '';
};
