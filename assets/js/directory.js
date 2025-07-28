/**
 * Marketplace data grouped by category. The page will initially render
 * with this placeholder data but will attempt to fetch live data from
 * Airtable via a Netlify serverless function. The live data will
 * replace this placeholder content once loaded.
 */
let directoryData = [
  {
    category: 'Suppliers',
    description: 'Trusted vendors providing quality components, materials and raw goods.',
    companies: [
      'Example Supplier Co',
      'American Parts Inc.',
      'Patriot Supplies',
      'Liberty Components',
      'Foundry Works'
    ]
  },
  {
    category: 'Manufacturers',
    description: 'Companies that make finished goods right here in the USA.',
    companies: [
      'Heritage Manufacturing',
      'Star‑Spangled Fabricators',
      'U.S. Ironworks',
      'Redwood Furnishings',
      'Eagle Electronics'
    ]
  },
  {
    category: 'Contracting Organizations',
    description: 'Partners who contract, build and manage large projects.',
    companies: [
      'Federal Contracts Corp',
      'Local Build Partners',
      'Blue River Construction',
      'North Star Contractors',
      'Rapid Response Logistics'
    ]
  },
  {
    category: 'American‑Made Brands',
    description: 'Consumer brands proudly designing and producing goods in the U.S.',
    companies: [
      'Made in USA Apparel',
      'Freedom Furniture',
      'Rustic Home Goods',
      'Classic Crafts',
      'Pioneer Outdoors'
    ]
  },
  {
    category: 'Retailers',
    description: 'Stores and shops that stock American‑made products.',
    companies: [
      'American Goods Outlet',
      'Stars & Stripes Supply',
      'Main Street Market',
      'Liberty Retail Group',
      'Heartland Store'
    ]
  }
];

const resultsEl = document.getElementById('results');
const searchInput = document.getElementById('searchInput');

// Render category sections into the DOM
function render(data) {
  resultsEl.innerHTML = '';
  data.forEach(cat => {
    // Only show categories if they contain companies after filtering
    if (cat.companies.length > 0) {
      const section = document.createElement('section');
      section.className = 'category-section';
      const h2 = document.createElement('h2');
      h2.textContent = cat.category;
      const desc = document.createElement('p');
      desc.className = 'category-desc';
      desc.textContent = cat.description;
      const ul = document.createElement('ul');
      ul.className = 'company-list';
      cat.companies.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        ul.appendChild(li);
      });
      section.appendChild(h2);
      section.appendChild(desc);
      section.appendChild(ul);
      resultsEl.appendChild(section);
    }
  });
}

// A copy of the original data used to reset the view when the search
// input is cleared. This will be replaced when live data loads.
let originalData = directoryData.map(cat => ({
  category: cat.category,
  description: cat.description,
  companies: [...cat.companies]
}));

function filterData() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    render(originalData);
    return;
  }
  const filtered = originalData.map(cat => ({
    category: cat.category,
    description: cat.description,
    companies: cat.companies.filter(name => name.toLowerCase().includes(term))
  }));
  render(filtered);
}

searchInput.addEventListener('input', filterData);

// Initial render
render(originalData);

/**
 * Attempt to load live company data from Airtable via the Netlify
 * function. If successful the placeholder data will be replaced and
 * the directory re-rendered. Records are expected to have fields
 * "Company Name" and "Type". Additional fields will be ignored.
 */
async function fetchLiveData() {
  try {
    const resp = await fetch('/.netlify/functions/getCompanies');
    if (!resp.ok) return;
    const records = await resp.json();
    if (!Array.isArray(records) || records.length === 0) return;
    // Group records by their type field.
    const grouped = {};
    records.forEach(rec => {
      const fields = rec.fields || {};
      const name = fields['Company Name'];
      const type = fields['Type'] || 'Uncategorized';
      if (!name) return;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(name);
    });
    // Build the directory data structure from the grouped results. Preserve
    // any descriptions from the placeholder dataset where categories match.
    const updatedData = Object.keys(grouped).map(type => {
      const placeholder = directoryData.find(cat => cat.category === type);
      return {
        category: type,
        description: placeholder ? placeholder.description : '',
        companies: grouped[type]
      };
    });
    directoryData = updatedData;
    originalData = directoryData.map(cat => ({
      category: cat.category,
      description: cat.description,
      companies: [...cat.companies]
    }));
    render(originalData);
  } catch (err) {
    // If the fetch fails (e.g. function not configured) silently ignore
    console.error('Failed to fetch live data:', err);
  }
}

// Kick off data fetching after DOM content has loaded
document.addEventListener('DOMContentLoaded', fetchLiveData);
