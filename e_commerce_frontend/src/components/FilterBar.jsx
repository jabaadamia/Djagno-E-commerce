import React, { useState, useEffect } from 'react';
import '../styles/FilterBar.css';
import { getCategories } from '../services/api';

function FilterBar({ filters, onApplyFilters }) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats.results || []);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'categories') {
      setLocalFilters(prev => {
        const prevCats = Array.isArray(prev.categories) ? prev.categories : [];
        let newCats;
        if (checked) {
          newCats = [...prevCats, value];
        } else {
          newCats = prevCats.filter(cat => cat !== value);
        }
        return { ...prev, categories: newCats };
      });
    } else {
      setLocalFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleApply = () => {
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (key === 'categories' && Array.isArray(value) && value.length > 0) {
        acc.categories = value.join(',');
      } else if (value !== '' && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});
    onApplyFilters(cleanedFilters);
  };

  const handleClear = () => {
    setLocalFilters({ name: '', min_price: '', max_price: '', ordering: '', categories: [] });
    onApplyFilters({});
  };

  return (
    <div className="filter-bar-vertical">
      <h3 className="filter-bar-title">Filters</h3>
      <div className="filter-group-vertical">
        <label className="filter-label">Search</label>
        <input
          type="text"
          name="name"
          placeholder="Search products..."
          value={localFilters.name || ''}
          onChange={handleChange}
          className="filter-input"
        />
      </div>
      <div className="filter-group-vertical">
        <label className="filter-label">Price</label>
        <input
          type="number"
          name="min_price"
          placeholder="Min price"
          value={localFilters.min_price || ''}
          onChange={handleChange}
          className="filter-input"
        />
        <input
          type="number"
          name="max_price"
          placeholder="Max price"
          value={localFilters.max_price || ''}
          onChange={handleChange}
          className="filter-input"
        />
      </div>
      <div className="filter-group-vertical">
        <label className="filter-label">Categories</label>
        <div className="filter-categories-list">
          {categories.map((cat) => (
            <label key={cat.id} className="filter-category-checkbox">
              <input
                type="checkbox"
                name="categories"
                value={cat.name}
                checked={Array.isArray(localFilters.categories) && localFilters.categories.includes(cat.name)}
                onChange={handleChange}
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>
      <div className="filter-group-vertical">
        <label className="filter-label">Sort by</label>
        <select
          name="ordering"
          value={localFilters.ordering || ''}
          onChange={handleChange}
          className="filter-select"
        >
          <option value="">Sort by</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
        </select>
      </div>
      <div style={{display: 'flex', flexDirection: 'row', gap: '1rem'}}>
        <button
        className="apply-filters-button"
        onClick={handleApply}
        >
          Apply Filters
        </button>
        <button
          className="clear-filters-button"
          onClick={handleClear}
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default FilterBar;
