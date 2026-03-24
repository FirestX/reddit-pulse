interface News {
  id: string;
  title: string;
  author: string;
  upvotes: number;
  imageUrl: string | null;
  subreddit: string;
  commentsCount?: number;
}

// Configuration
const API_BASE_URL = 'http://localhost:5253';
const INVALID_IMAGE_VALUES = ['self', 'default', 'nsfw', ''];
const CATEGORY_TITLES: Record<string, string> = {
  trends: 'Reddit Trends',
  funny: 'Funny & Memes',
  news: 'News & Politics',
  gaming: 'Gaming',
  linux: 'Linux',
  technology: 'Technology'
};

// State
let currentCategory = 'trends';
const cachedNews = new Map<string, News[]>();

// DOM Elements
const elements = {
  newsGrid: document.getElementById('news-grid')!,
  error: document.getElementById('error')!,
  pageTitle: document.getElementById('page-title')!,
  refreshBtn: document.getElementById('refresh-btn')!,
  searchInput: document.getElementById('search-input') as HTMLInputElement,
  searchBtn: document.getElementById('search-btn')!,
  modal: document.getElementById('post-modal')!,
  modalClose: document.getElementById('modal-close')!,
  modalTitle: document.getElementById('modal-title')!,
  modalSubreddit: document.getElementById('modal-subreddit')!,
  modalImage: document.getElementById('modal-image') as HTMLImageElement,
  modalAuthor: document.getElementById('modal-author')!,
  modalUpvotes: document.getElementById('modal-upvotes')!,
  modalComments: document.getElementById('modal-comments')!,
  modalCommentsContainer: document.getElementById('modal-comments-container')!,
  modalOpenReddit: document.getElementById('modal-open-reddit')!,
  modalCopyLink: document.getElementById('modal-copy-link')!,
  toast: document.getElementById('toast')!,
  toastMessage: document.getElementById('toast-message')!
};

// Utility Functions
const getImageUrl = (news: News): string => {
  if (!news.imageUrl || INVALID_IMAGE_VALUES.includes(news.imageUrl)) return '';
  return news.imageUrl;
};

const hasValidImage = (news: News): boolean => !!getImageUrl(news);

const getPostUrl = (id: string): string => `https://reddit.com/comments/${id}`;

const getApiUrl = (category: string): string => {
  if (category === 'trends') return `${API_BASE_URL}/api/trends`;
  if (category.startsWith('search:')) return `${API_BASE_URL}/api/trends/${category.slice(7)}`;
  return `${API_BASE_URL}/api/group/${category}`;
};

// Toast Notification
const showToast = (message: string): void => {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add('show');
  setTimeout(() => elements.toast.classList.remove('show'), 3000);
};

// Modal Functions
const openModal = (news: News): void => {
  const { modalTitle, modalSubreddit, modalAuthor, modalUpvotes, modalImage, 
          modalComments, modalCommentsContainer, modalOpenReddit, modalCopyLink, modal } = elements;
  
  modalTitle.textContent = news.title;
  modalSubreddit.textContent = `r/${news.subreddit}`;
  modalAuthor.innerHTML = `Posted by <strong>u/${news.author}</strong>`;
  modalUpvotes.textContent = news.upvotes.toLocaleString();

  const imageUrl = getImageUrl(news);
  if (imageUrl) {
    modalImage.src = imageUrl;
    modalImage.alt = news.title;
    modalImage.style.display = 'block';
    modalImage.onerror = () => { modalImage.style.display = 'none'; };
  } else {
    modalImage.style.display = 'none';
    modalImage.src = '';
  }

  if (news.commentsCount != null) {
    modalComments.textContent = news.commentsCount.toLocaleString();
    modalCommentsContainer.style.display = 'flex';
  } else {
    modalCommentsContainer.style.display = 'none';
  }

  const postUrl = getPostUrl(news.id);
  modalOpenReddit.onclick = () => window.open(postUrl, '_blank');
  modalCopyLink.onclick = () => {
    navigator.clipboard.writeText(postUrl)
      .then(() => showToast('Link copied to clipboard!'))
      .catch(() => showToast('Failed to copy link'));
  };

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
};

const closeModal = (): void => {
  elements.modal.classList.remove('show');
  document.body.style.overflow = 'auto';
};

// Card Rendering
const createCardHTML = (news: News): string => {
  const imageUrl = getImageUrl(news);
  const meta = `By u/${news.author} • ${news.upvotes.toLocaleString()} upvotes`;

  if (imageUrl) {
    return `
      <img src="${imageUrl}" class="card-image" alt="${news.title}" onerror="this.style.display='none'">
      <div class="card-content">
        <span class="card-subreddit">${news.subreddit}</span>
        <h3 class="card-title">${news.title}</h3>
        <div class="card-meta">${meta}</div>
      </div>
    `;
  }

  return `
    <div class="card-text-content">
      <span class="card-text-subreddit">${news.subreddit}</span>
      <h3 class="card-text-title">${news.title}</h3>
      <div class="card-text-meta">${meta}</div>
    </div>
  `;
};

const renderNews = (newsList: News[]): void => {
  const { newsGrid } = elements;
  newsGrid.innerHTML = '';

  if (!newsList.length) {
    newsGrid.innerHTML = '<p class="no-posts">No posts found.</p>';
    return;
  }

  newsList.forEach(news => {
    const card = document.createElement('div');
    card.className = hasValidImage(news) ? 'card' : 'card-text-only';
    card.innerHTML = createCardHTML(news);
    card.addEventListener('click', () => openModal(news));
    newsGrid.appendChild(card);
  });
};

const renderSkeletons = (count = 6): void => {
  elements.newsGrid.innerHTML = Array(count).fill(`
    <div class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-tag"></div>
        <div class="skeleton-title"></div>
        <div class="skeleton-title-2"></div>
        <div class="skeleton-meta"></div>
      </div>
    </div>
  `).join('');
};

// API Functions
const fetchNews = async (category: string): Promise<News[]> => {
  if (cachedNews.has(category)) return cachedNews.get(category)!;

  const response = await fetch(getApiUrl(category));
  if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

  const news: News[] = await response.json();
  cachedNews.set(category, news);
  return news;
};

const loadNews = async (category: string): Promise<void> => {
  currentCategory = category;
  renderSkeletons();
  elements.error.style.display = 'none';
  elements.pageTitle.textContent = CATEGORY_TITLES[category] || 'Reddit Pulse';

  try {
    renderNews(await fetchNews(category));
  } catch (error) {
    elements.newsGrid.innerHTML = '';
    elements.error.style.display = 'block';
    elements.error.querySelector('p')!.textContent = 
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Backend: ${API_BASE_URL}`;
  }
};

// Event Handlers
const setupEventListeners = (): void => {
  const categoryButtons = document.querySelectorAll('.category-filter-btn');

  // Category buttons
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', function(this: HTMLElement) {
      categoryButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadNews(this.dataset.category!);
    });
  });

  // Refresh button
  elements.refreshBtn.addEventListener('click', () => {
    cachedNews.delete(currentCategory);
    loadNews(currentCategory);
  });

  // Search
  const performSearch = (): void => {
    const term = elements.searchInput.value.trim();
    if (!term) return;
    
    document.querySelectorAll('.category-filter-btn').forEach(b => b.classList.remove('active'));
    elements.pageTitle.textContent = `r/${term}`;
    loadNews(`search:${term}`);
  };

  elements.searchBtn.addEventListener('click', performSearch);
  elements.searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') performSearch();
  });

  // Modal
  elements.modalClose.addEventListener('click', closeModal);
  elements.modal.addEventListener('click', e => {
    if (e.target === elements.modal) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && elements.modal.classList.contains('show')) closeModal();
  });
};

// Initialize
if (elements.newsGrid) {
  setupEventListeners();
  loadNews('trends');
}
