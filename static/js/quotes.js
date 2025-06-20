/**
 * Quote Display Application
 * Handles loading, displaying, and filtering quotes
 */

class QuoteApp {
    constructor() {
        this.quotes = [];
        this.filteredQuotes = [];
        this.currentIndex = 0;
        this.isLoading = false;
        this.favorites = [];
        this.showingFavorites = false;
        this.isLightMode = this.loadThemeFromStorage();
        this.user = null;
        
        // DOM elements
        this.elements = {
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            errorMessage: document.getElementById('error-message'),
            mainContent: document.getElementById('main-content'),
            emptyState: document.getElementById('empty-state'),
            quoteText: document.getElementById('quote-text'),
            quoteAuthor: document.getElementById('quote-author'),
            quoteYear: document.getElementById('quote-year'),
            quoteTopic: document.getElementById('quote-topic'),
            quoteSubtopic: document.getElementById('quote-subtopic'),
            quoteSource: document.getElementById('quote-source'),
            topicFilter: document.getElementById('topic-filter'),
            authorFilter: document.getElementById('author-filter'),
            clearFilters: document.getElementById('clear-filters'),
            clearFiltersEmpty: document.getElementById('clear-filters-empty'),
            prevQuote: document.getElementById('prev-quote'),
            nextQuote: document.getElementById('next-quote'),
            randomQuote: document.getElementById('random-quote'),
            copyQuote: document.getElementById('copy-quote'),
            favoriteQuote: document.getElementById('favorite-quote'),
            searchQuote: document.getElementById('search-quote'),
            showFavorites: document.getElementById('show-favorites'),
            clearFavoritesFilter: document.getElementById('clear-favorites-filter'),
            favoritesCount: document.getElementById('favorites-count'),
            themeToggle: document.getElementById('theme-toggle'),
            loginBtn: document.getElementById('login-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            userSection: document.getElementById('user-section'),
            currentQuoteNumber: document.getElementById('current-quote-number'),
            totalQuotes: document.getElementById('total-quotes'),
            filteredInfo: document.getElementById('filtered-info'),
            filteredCount: document.getElementById('filtered-count'),
            copyToast: document.getElementById('copy-toast')
        };
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading();
            await this.loadQuotes();
            await this.loadUserInfo();
            this.setupEventListeners();
            this.setupFilters();
            this.applyTheme();
            this.showQuote();
            this.showMainContent();
        } catch (error) {
            this.showError('Failed to initialize the application: ' + error.message);
        }
    }
    
    /**
     * Load quotes from the JSON file
     */
    async loadQuotes() {
        try {
            const response = await fetch('/api/quotes');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.quotes || !Array.isArray(data.quotes)) {
                throw new Error('Invalid data format: quotes array not found');
            }
            
            if (data.quotes.length === 0) {
                throw new Error('No quotes found in the dataset');
            }
            
            this.quotes = this.shuffleArray([...data.quotes]);
            this.filteredQuotes = [...this.quotes];
            
            console.log(`Loaded ${this.quotes.length} quotes successfully`);
            
        } catch (error) {
            console.error('Error loading quotes:', error);
            throw new Error('Unable to load quotes. Please check your internet connection and try again.');
        }
    }
    
    /**
     * Setup event listeners for navigation and filtering
     */
    setupEventListeners() {
        // Navigation buttons
        this.elements.prevQuote.addEventListener('click', () => this.previousQuote());
        this.elements.nextQuote.addEventListener('click', () => this.nextQuote());
        this.elements.randomQuote.addEventListener('click', () => this.randomQuote());
        
        // Filter controls
        this.elements.topicFilter.addEventListener('change', () => this.applyFilters());
        this.elements.authorFilter.addEventListener('change', () => this.applyFilters());
        this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
        this.elements.clearFiltersEmpty.addEventListener('click', () => this.clearFilters());
        
        // New feature controls
        if (this.elements.copyQuote) this.elements.copyQuote.addEventListener('click', () => this.copyCurrentQuote());
        if (this.elements.favoriteQuote) this.elements.favoriteQuote.addEventListener('click', () => this.toggleFavorite());
        if (this.elements.searchQuote) this.elements.searchQuote.addEventListener('click', () => this.searchQuoteMeaning());
        if (this.elements.showFavorites) this.elements.showFavorites.addEventListener('click', () => this.toggleFavoritesView());
        if (this.elements.clearFavoritesFilter) this.elements.clearFavoritesFilter.addEventListener('click', () => this.clearFavoritesView());
        if (this.elements.themeToggle) this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        if (this.elements.loginBtn) this.elements.loginBtn.addEventListener('click', () => this.login());
        if (this.elements.logoutBtn) this.elements.logoutBtn.addEventListener('click', () => this.logout());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') {
                return; // Don't interfere with form controls
            }
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousQuote();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextQuote();
                    break;
                case ' ':
                    e.preventDefault();
                    this.randomQuote();
                    break;
            }
        });
    }
    
    /**
     * Setup filter dropdowns with unique values
     */
    setupFilters() {
        // Get unique topics and authors
        const topics = [...new Set(this.quotes.map(quote => quote.topic))].sort();
        const authors = [...new Set(this.quotes.map(quote => quote.author))].sort();
        
        // Populate topic filter
        this.elements.topicFilter.innerHTML = '<option value="">All Topics</option>';
        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            this.elements.topicFilter.appendChild(option);
        });
        
        // Populate author filter
        this.elements.authorFilter.innerHTML = '<option value="">All Authors</option>';
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            this.elements.authorFilter.appendChild(option);
        });
    }
    
    /**
     * Apply current filters to the quotes
     */
    applyFilters() {
        const selectedTopic = this.elements.topicFilter.value;
        const selectedAuthor = this.elements.authorFilter.value;
        
        let quotesToFilter = this.showingFavorites ? 
            this.quotes.filter(quote => this.favorites.includes(this.getQuoteId(quote))) : 
            this.quotes;
        
        this.filteredQuotes = quotesToFilter.filter(quote => {
            const topicMatch = !selectedTopic || quote.topic === selectedTopic;
            const authorMatch = !selectedAuthor || quote.author === selectedAuthor;
            return topicMatch && authorMatch;
        });
        
        // Reset current index
        this.currentIndex = 0;
        
        // Update display
        if (this.filteredQuotes.length === 0) {
            this.showEmptyState();
        } else {
            this.showMainContent();
            this.showQuote();
        }
        
        this.updateFilterInfo();
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        this.elements.topicFilter.value = '';
        this.elements.authorFilter.value = '';
        this.applyFilters();
    }
    
    /**
     * Update filter information display
     */
    updateFilterInfo() {
        const isFiltered = this.filteredQuotes.length !== this.quotes.length;
        
        if (isFiltered) {
            this.elements.filteredInfo.classList.remove('d-none');
            this.elements.filteredCount.textContent = this.filteredQuotes.length;
        } else {
            this.elements.filteredInfo.classList.add('d-none');
        }
        
        this.elements.totalQuotes.textContent = this.quotes.length;
    }
    
    /**
     * Display the current quote
     */
    showQuote() {
        if (this.filteredQuotes.length === 0) {
            this.showEmptyState();
            return;
        }
        
        const quote = this.filteredQuotes[this.currentIndex];
        
        // Add transition effect with shimmer
        const quoteCard = this.elements.quoteText.parentElement.parentElement;
        quoteCard.classList.add('quote-transition');
        
        // Add shimmer overlay
        const shimmerOverlay = document.createElement('div');
        shimmerOverlay.className = 'shimmer-overlay';
        quoteCard.appendChild(shimmerOverlay);
        
        setTimeout(() => {
            // Update quote content
            this.elements.quoteText.textContent = quote.quote;
            this.elements.quoteAuthor.textContent = quote.author;
            this.elements.quoteYear.textContent = quote.year ? `(${quote.year})` : '';
            this.elements.quoteTopic.textContent = quote.topic;
            this.elements.quoteSubtopic.textContent = quote.subtopic || 'General';
            this.elements.quoteSource.textContent = quote.from ? `from ${quote.from}` : '';
            
            // Add text glow effect
            this.elements.quoteText.classList.add('quote-text-glow');
            
            // Update counter
            this.elements.currentQuoteNumber.textContent = this.currentIndex + 1;
            
            // Update button states
            this.elements.prevQuote.disabled = this.filteredQuotes.length <= 1;
            this.elements.nextQuote.disabled = this.filteredQuotes.length <= 1;
            
            // Update favorite button state
            this.updateFavoriteButton(quote);
            
            // Show transition
            quoteCard.classList.add('show');
        }, 150);
        
        // Remove transition and shimmer effects after animation
        setTimeout(() => {
            quoteCard.classList.remove('quote-transition');
            this.elements.quoteText.classList.remove('quote-text-glow');
            if (shimmerOverlay.parentNode) {
                shimmerOverlay.parentNode.removeChild(shimmerOverlay);
            }
        }, 1200);
    }
    
    /**
     * Navigate to previous quote
     */
    previousQuote() {
        if (this.filteredQuotes.length <= 1) return;
        
        this.currentIndex = this.currentIndex === 0 
            ? this.filteredQuotes.length - 1 
            : this.currentIndex - 1;
        
        this.showQuote();
    }
    
    /**
     * Navigate to next quote
     */
    nextQuote() {
        if (this.filteredQuotes.length <= 1) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.filteredQuotes.length;
        this.showQuote();
    }
    
    /**
     * Show a random quote
     */
    randomQuote() {
        if (this.filteredQuotes.length <= 1) return;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.filteredQuotes.length);
        } while (newIndex === this.currentIndex && this.filteredQuotes.length > 1);
        
        this.currentIndex = newIndex;
        this.showQuote();
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.elements.loadingState.classList.remove('d-none');
        this.elements.errorState.classList.add('d-none');
        this.elements.mainContent.classList.add('d-none');
        this.elements.emptyState.classList.add('d-none');
    }
    
    /**
     * Show error state
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.loadingState.classList.add('d-none');
        this.elements.errorState.classList.remove('d-none');
        this.elements.mainContent.classList.add('d-none');
        this.elements.emptyState.classList.add('d-none');
    }
    
    /**
     * Show main content
     */
    showMainContent() {
        this.elements.loadingState.classList.add('d-none');
        this.elements.errorState.classList.add('d-none');
        this.elements.mainContent.classList.remove('d-none');
        this.elements.emptyState.classList.add('d-none');
        this.updateFilterInfo();
    }
    
    /**
     * Show empty state when no quotes match filters
     */
    showEmptyState() {
        this.elements.loadingState.classList.add('d-none');
        this.elements.errorState.classList.add('d-none');
        this.elements.mainContent.classList.add('d-none');
        this.elements.emptyState.classList.remove('d-none');
    }
    
    /**
     * Copy current quote to clipboard
     */
    async copyCurrentQuote() {
        if (this.filteredQuotes.length === 0) return;
        
        const quote = this.filteredQuotes[this.currentIndex];
        const textToCopy = `"${quote.quote}" - ${quote.author}${quote.year ? ` (${quote.year})` : ''}`;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showCopyToast();
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopyToast();
        }
    }
    
    /**
     * Show copy success toast
     */
    showCopyToast() {
        if (this.elements.copyToast && typeof bootstrap !== 'undefined') {
            const toast = new bootstrap.Toast(this.elements.copyToast);
            toast.show();
        }
    }
    
    /**
     * Generate unique ID for a quote
     */
    getQuoteId(quote) {
        return `${quote.quote}_${quote.author}_${quote.year}`.replace(/[^a-zA-Z0-9]/g, '');
    }
    
    /**
     * Toggle favorite status of current quote
     */
    async toggleFavorite() {
        if (this.filteredQuotes.length === 0) return;
        
        const quote = this.filteredQuotes[this.currentIndex];
        const quoteId = this.getQuoteId(quote);
        
        if (!this.user) {
            // Show login prompt if not authenticated
            if (confirm('Login to save your favorites permanently. Continue?')) {
                this.login();
            }
            return;
        }
        
        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quote_id: quoteId })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.action === 'added') {
                    this.favorites.push(quoteId);
                } else {
                    this.favorites = this.favorites.filter(id => id !== quoteId);
                }
                
                this.updateFavoriteButton(quote);
                this.updateFavoritesCount();
            } else {
                console.error('Failed to toggle favorite');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }
    
    /**
     * Update favorite button appearance
     */
    updateFavoriteButton(quote) {
        if (!this.elements.favoriteQuote) return;
        
        const quoteId = this.getQuoteId(quote);
        const isFavorite = this.favorites.includes(quoteId);
        
        if (isFavorite) {
            this.elements.favoriteQuote.innerHTML = '<i class="fas fa-heart me-2"></i>Favorited';
            this.elements.favoriteQuote.classList.remove('btn-outline-warning');
            this.elements.favoriteQuote.classList.add('btn-warning');
        } else {
            this.elements.favoriteQuote.innerHTML = '<i class="far fa-heart me-2"></i>Favorite';
            this.elements.favoriteQuote.classList.remove('btn-warning');
            this.elements.favoriteQuote.classList.add('btn-outline-warning');
        }
    }
    
    /**
     * Update favorites count display
     */
    updateFavoritesCount() {
        if (this.elements.favoritesCount) {
            this.elements.favoritesCount.textContent = this.favorites.length;
        }
    }
    
    /**
     * Search quote meaning on Google
     */
    searchQuoteMeaning() {
        if (this.filteredQuotes.length === 0) return;
        
        const quote = this.filteredQuotes[this.currentIndex];
        const searchQuery = `"${quote.quote}" meaning behind`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        
        window.open(googleUrl, '_blank');
    }
    
    /**
     * Toggle favorites view
     */
    toggleFavoritesView() {
        if (this.favorites.length === 0) {
            if (!this.user) {
                alert('Login to save and view your favorite quotes!');
            } else {
                alert('No favorites yet! Add some quotes to your favorites first.');
            }
            return;
        }
        
        this.showingFavorites = true;
        if (this.elements.clearFavoritesFilter) this.elements.clearFavoritesFilter.classList.remove('d-none');
        if (this.elements.showFavorites) this.elements.showFavorites.classList.add('d-none');
        this.applyFilters();
    }
    
    /**
     * Clear favorites view and show all quotes
     */
    clearFavoritesView() {
        this.showingFavorites = false;
        if (this.elements.clearFavoritesFilter) this.elements.clearFavoritesFilter.classList.add('d-none');
        if (this.elements.showFavorites) this.elements.showFavorites.classList.remove('d-none');
        this.applyFilters();
    }
    
    /**
     * Load user information and favorites from server
     */
    async loadUserInfo() {
        try {
            const response = await fetch('/api/user_info');
            const data = await response.json();
            
            if (data.authenticated) {
                this.user = data.user;
                await this.loadUserFavorites();
                this.showUserSection();
            } else {
                this.user = null;
                this.favorites = this.loadFavoritesFromStorage(); // Fallback to local storage
                this.showLoginSection();
            }
            
            this.updateFavoritesCount();
        } catch (error) {
            console.error('Error loading user info:', error);
            this.user = null;
            this.favorites = this.loadFavoritesFromStorage();
            this.showLoginSection();
            this.updateFavoritesCount();
        }
    }
    
    /**
     * Load user's favorites from database
     */
    async loadUserFavorites() {
        if (!this.user) return;
        
        try {
            const response = await fetch('/api/favorites');
            const data = await response.json();
            this.favorites = data.favorites || [];
        } catch (error) {
            console.error('Error loading user favorites:', error);
            this.favorites = [];
        }
    }
    
    /**
     * Show login section
     */
    showLoginSection() {
        if (this.elements.loginBtn) this.elements.loginBtn.classList.remove('d-none');
        if (this.elements.userSection) this.elements.userSection.classList.add('d-none');
    }
    
    /**
     * Show user section
     */
    showUserSection() {
        if (this.elements.loginBtn) this.elements.loginBtn.classList.add('d-none');
        if (this.elements.userSection) this.elements.userSection.classList.remove('d-none');
    }
    
    /**
     * Login user
     */
    login() {
        window.location.href = '/auth/login';
    }
    
    /**
     * Logout user
     */
    logout() {
        window.location.href = '/auth/logout';
    }
    
    /**
     * Save favorites to localStorage (fallback)
     */
    saveFavoritesToStorage() {
        localStorage.setItem('quoteFavorites', JSON.stringify(this.favorites));
    }
    
    /**
     * Load favorites from localStorage (fallback)
     */
    loadFavoritesFromStorage() {
        try {
            const saved = localStorage.getItem('quoteFavorites');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading favorites:', error);
            return [];
        }
    }
    
    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        this.isLightMode = !this.isLightMode;
        this.applyTheme();
        this.saveThemeToStorage();
    }
    
    /**
     * Apply the current theme
     */
    applyTheme() {
        if (this.isLightMode) {
            document.body.classList.add('light-mode');
            if (this.elements.themeToggle) {
                this.elements.themeToggle.innerHTML = '<i class="fas fa-moon me-1"></i>Dark Mode';
            }
        } else {
            document.body.classList.remove('light-mode');
            if (this.elements.themeToggle) {
                this.elements.themeToggle.innerHTML = '<i class="fas fa-sun me-1"></i>Light Mode';
            }
        }
    }
    
    /**
     * Save theme preference to localStorage
     */
    saveThemeToStorage() {
        localStorage.setItem('neonOracleTheme', JSON.stringify(this.isLightMode));
    }
    
    /**
     * Load theme preference from localStorage
     */
    loadThemeFromStorage() {
        try {
            const saved = localStorage.getItem('neonOracleTheme');
            return saved ? JSON.parse(saved) : false; // Default to dark mode
        } catch (error) {
            console.error('Error loading theme:', error);
            return false;
        }
    }
    
    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuoteApp();
});

// Add some helpful console messages for debugging
console.log('Quote Display Application loaded');
console.log('Keyboard shortcuts:');
console.log('  ← Previous quote');
console.log('  → Next quote');
console.log('  Space: Random quote');
