export default function CategoryCard({ category, imageUrl, onSelect, selected }) {
  const imageSource = imageUrl || category.imageUrl || category.imageData;

  return (
    <article
      className={`category-card${selected ? ' selected' : ''}`}
      onClick={() => onSelect(category)}
    >
      {imageSource && (
        <div className="category-card-img">
          <img src={imageSource} alt={category.name} loading="lazy" />
        </div>
      )}
      <div className="category-card-body">
        <h3 className="category-card-name">{category.name}</h3>
        <p className="category-card-meta">
          {category.itemCount || 0} {category.itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>
    </article>
  );
}
