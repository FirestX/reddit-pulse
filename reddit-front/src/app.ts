// Interfaccia che corrisponde al modello News del backend
interface News {
  id: string;
  title: string;
  author: string;
  upvotes: number;
  imageUrl: string | null;
  subreddit: string;
}

// Configurazione API
const API_BASE_URL = 'http://localhost:5253';

// Stato corrente dell'applicazione
let currentCategory: string = 'trends';
let cachedNews: Map<string, News[]> = new Map();

// Elementi del DOM
const newsGrid = document.getElementById('news-grid') as HTMLElement;
const errorEl = document.getElementById('error') as HTMLElement;
const pageTitle = document.getElementById('page-title') as HTMLElement;
const refreshBtn = document.getElementById('refresh-btn') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchBtn = document.getElementById('search-btn') as HTMLElement;

// Recupera le notizie dall'API
async function fetchNews(category: string): Promise<News[]> {
  // Controlla prima la cache
  if (cachedNews.has(category)) {
    return cachedNews.get(category)!;
  }

  let apiUrl: string;
  if (category === 'trends') {
    apiUrl = `${API_BASE_URL}/api/trends`;
  } else if (category.startsWith('search:')) {
    // Gestisce le query di ricerca
    const subreddit = category.replace('search:', '');
    apiUrl = `${API_BASE_URL}/api/trends/${subreddit}`;
  } else {
    apiUrl = `${API_BASE_URL}/api/group/${category}`;
  }

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch news: ${response.statusText}`);
  }

  const news: News[] = await response.json();
  cachedNews.set(category, news);
  return news;
}

// Ottiene l'URL dell'immagine appropriato o stringa vuota se non disponibile
function getImageUrl(news: News): string {
  if (!news.imageUrl || news.imageUrl === 'self' || news.imageUrl === 'default' || news.imageUrl === 'nsfw') {
    return '';
  }
  return news.imageUrl;
}

// Verifica se il post ha un'immagine valida
function hasValidImage(news: News): boolean {
  return !!(news.imageUrl && news.imageUrl !== 'self' && news.imageUrl !== 'default' && news.imageUrl !== 'nsfw');
}

// Renderizza le card delle notizie
function renderNews(newsList: News[]) {
  newsGrid.innerHTML = '';
  
  if (newsList.length === 0) {
    newsGrid.innerHTML = '<p class="no-posts">No posts found.</p>';
    return;
  }

  newsList.forEach(news => {
    const card = document.createElement('a');
    card.href = `https://reddit.com/comments/${news.id}`;
    card.target = '_blank';
    
    // Se il post ha un'immagine valida, crea una card con immagine
    if (hasValidImage(news)) {
      card.className = 'card';
      card.innerHTML = `
        <img src="${getImageUrl(news)}" class="card-image" alt="${news.title}" onerror="this.style.display='none'">
        <div class="card-content">
          <span class="card-subreddit">${news.subreddit}</span>
          <h3 class="card-title">${news.title}</h3>
          <div class="card-meta">
            By u/${news.author} • ${news.upvotes} upvotes
          </div>
        </div>
      `;
    } else {
      // Se non c'è immagine, crea una card di testo minimalista
      card.className = 'card-text-only';
      card.innerHTML = `
        <div class="card-text-content">
          <span class="card-text-subreddit">${news.subreddit}</span>
          <h3 class="card-text-title">${news.title}</h3>
          <div class="card-text-meta">
            By u/${news.author} • ${news.upvotes} upvotes
          </div>
        </div>
      `;
    }
    
    newsGrid.appendChild(card);
  });
}

// Renderizza le card skeleton durante il caricamento
function renderSkeletonCards(count: number = 6) {
  newsGrid.innerHTML = '';
  
  for (let i = 0; i < count; i++) {
    const skeletonCard = document.createElement('div');
    skeletonCard.className = 'skeleton-card';
    skeletonCard.innerHTML = `
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-tag"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-title-2"></div>
        <div class="skeleton-meta"></div>
      </div>
    `;
    newsGrid.appendChild(skeletonCard);
  }
}

// Carica e mostra le notizie
async function loadNews(category: string) {
  currentCategory = category;
  
  // Mostra le card skeleton
  renderSkeletonCards(6);
  errorEl.style.display = 'none';
  
  // Aggiorna il titolo della pagina
  const titles: { [key: string]: string } = {
    'trends': 'Reddit Trends',
    'funny': 'Funny & Memes',
    'news': 'News & Politics',
    'gaming': 'Gaming',
    'linux': 'Linux',
    'technology': 'Technology'
  };
  pageTitle.textContent = titles[category] || 'Reddit Pulse';

  try {
    const news = await fetchNews(category);
    renderNews(news);
  } catch (error) {
    newsGrid.innerHTML = '';
    errorEl.style.display = 'block';
    errorEl.querySelector('p')!.textContent = `Error loading posts: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure the backend is running on ${API_BASE_URL}`;
    console.error('Error fetching news:', error);
  }
}

// Inizializza l'applicazione
if (newsGrid) {
  // Carica la categoria iniziale (trends)
  loadNews('trends');

  // Gestori per i pulsanti delle categorie
  const categoryButtons = document.querySelectorAll('.category-filter-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', function(this: HTMLElement) {
      const category = this.getAttribute('data-category')!;
      
      // Aggiorna lo stato attivo
      categoryButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Carica le notizie per la categoria
      loadNews(category);
    });
  });

  // Gestore per il pulsante refresh
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      // Cancella la cache per la categoria corrente
      cachedNews.delete(currentCategory);
      loadNews(currentCategory);
    });
  }

  // Funzionalità di ricerca
  const performSearch = () => {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
      return;
    }

    // Rimuove lo stato attivo dai pulsanti delle categorie
    categoryButtons.forEach(b => b.classList.remove('active'));

    // Carica i risultati della ricerca
    const searchCategory = `search:${searchTerm}`;
    loadNews(searchCategory);
    
    // Aggiorna il titolo della pagina
    pageTitle.textContent = `r/${searchTerm}`;
  };

  if (searchBtn && searchInput) {
    // Click sul pulsante di ricerca
    searchBtn.addEventListener('click', performSearch);

    // Tasto Enter nell'input di ricerca
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }
}
