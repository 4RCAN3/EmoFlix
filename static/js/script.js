document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Recommendation form submission
    const recommendationForm = document.getElementById('recommendation-form');
    const loadingContainer = document.getElementById('loading');
    const recommendationsSection = document.getElementById('recommendations');
    const recommendationResults = document.getElementById('recommendation-results');

    // Update weight display percentages
    const emotionWeight = document.getElementById('emotion-weight');
    const currentWeightDisplay = document.getElementById('current-weight');
    const desiredWeightDisplay = document.getElementById('desired-weight');

    if (emotionWeight) {
        emotionWeight.addEventListener('input', function() {
            const desiredPercent = this.value;
            const currentPercent = 100 - desiredPercent;
            currentWeightDisplay.textContent = `${currentPercent}%`;
            desiredWeightDisplay.textContent = `${desiredPercent}%`;
        });
    }

    if (recommendationForm) {
        recommendationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentEmotion = document.getElementById('current-emotion').value.trim();
            const desiredEmotion = document.getElementById('desired-emotion').value.trim();
            const movieCount = document.getElementById('movie-count').value;
            const emotionWeight = document.getElementById('emotion-weight').value / 100; // Convert to 0-1 range
            
            if (!currentEmotion || !desiredEmotion) {
                alert('Please describe both your current and desired emotional states.');
                return;
            }
            
            // Show loading animation
            loadingContainer.classList.add('active');
            recommendationsSection.classList.add('hidden');
            
            // Scroll to loading section
            loadingContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Make API call to backend
            fetch('/recommend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_emotion: currentEmotion,
                    desired_emotion: desiredEmotion,
                    top_k: movieCount,
                    weight: emotionWeight
                })
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading and show recommendations
                loadingContainer.classList.remove('active');
                recommendationsSection.classList.remove('hidden');
                
                // Create recommendation elements
                recommendationResults.innerHTML = '';
                
                if (data.length === 0) {
                    recommendationResults.innerHTML = `
                        <div class="no-results">
                            <p>No matching movies found. Please try different emotional descriptions.</p>
                        </div>
                    `;
                    return;
                }
                
                data.forEach((movie, index) => {
                    const recommendationElement = createRecommendationElement(movie, index);
                    recommendationResults.appendChild(recommendationElement);
                });
                
                // Scroll to recommendations
                recommendationsSection.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(error => {
                console.error('Error:', error);
                loadingContainer.classList.remove('active');
                alert('An error occurred while fetching recommendations. Please try again.');
            });
        });
    }

    // Create recommendation element
    function createRecommendationElement(movie, index) {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.style.setProperty('--index', index);
        
        const scorePercentage = (movie.score * 100).toFixed(0);
        const genresHTML = movie.genres && movie.genres.length > 0 
            ? movie.genres.map(genre => `<span class="genre-tag">${genre.name}</span>`).join('')
            : '';
        
        div.innerHTML = `
            <div class="recommendation-poster">
                ${movie.poster_path 
                    ? `<img src="${movie.poster_path}" alt="${movie.title}">`
                    : `<div class="no-poster">
                        <i class="fas fa-film"></i>
                        <span>No Poster Available</span>
                       </div>`
                }
            </div>
            <div class="recommendation-info">
                <div class="recommendation-header">
                    <div class="recommendation-title">
                        <h3>${movie.title}</h3>
                        <p>${movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown Year'} 
                           ${movie.runtime ? `• ${movie.runtime} min` : ''}</p>
                    </div>
                    <div class="recommendation-score">
                        <i class="fas fa-heart-pulse"></i>
                        <span>${scorePercentage}%</span>
                    </div>
                </div>
                <div class="recommendation-genres">
                    ${genresHTML}
                </div>
                <div class="recommendation-description">
                    <p>${movie.overview || 'No description available.'}</p>
                </div>
                <div class="recommendation-actions">
                    <button class="view-movie" data-title="${movie.title}" 
                            data-overview="${movie.overview || ''}" 
                            data-poster="${movie.poster_path || ''}"
                            data-plot="${movie.plot || ''}"
                            data-year="${movie.release_date ? movie.release_date.substring(0, 4) : ''}"
                            data-rating="${movie.vote_average || ''}"
                            data-runtime="${movie.runtime || ''}"
                            data-director="${movie.director || ''}"
                            data-genres='${JSON.stringify(movie.genres || [])}'>
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="full-plot">
                        <i class="fas fa-book"></i> Full Plot
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to the buttons
        div.querySelector('.view-movie').addEventListener('click', function() {
            openMovieModal(this.dataset);
        });
        
        div.querySelector('.full-plot').addEventListener('click', function() {
            openMovieModal(div.querySelector('.view-movie').dataset, 'plot');
        });
        
        return div;
    }

    // Movie detail modal
    const modal = document.getElementById('movie-modal');
    
    // Close modal when clicking on X
    if (modal) {
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            closeModal();
        });
        
        // Close modal when clicking outside of content
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
    
    function openMovieModal(movieData, activeTab = 'overview') {
        // Populate modal with movie data
        document.getElementById('modal-title').textContent = movieData.title || 'Unknown Title';
        document.getElementById('modal-year').textContent = movieData.year || '';
        document.getElementById('modal-runtime').textContent = movieData.runtime ? `${movieData.runtime} min` : '';
        document.getElementById('modal-rating').textContent = movieData.rating ? `★ ${movieData.rating}/10` : '';
        document.getElementById('modal-director').textContent = movieData.director ? `Director: ${movieData.director}` : '';
        
        const modalPoster = document.getElementById('modal-poster');
        if (movieData.poster && movieData.poster !== 'null') {
            modalPoster.src = movieData.poster;
            modalPoster.alt = movieData.title;
            modalPoster.style.display = 'block';
        } else {
            modalPoster.style.display = 'none';
        }
        
        document.getElementById('modal-overview').textContent = movieData.overview || 'No overview available.';
        document.getElementById('modal-plot').textContent = movieData.plot || 'No detailed plot available.';
        
        // Set genres
        const modalGenres = document.getElementById('modal-genres');
        modalGenres.innerHTML = '';
        try {
            const genres = typeof movieData.genres === 'string' ? JSON.parse(movieData.genres) : movieData.genres;
            if (genres && genres.length > 0) {
                genres.forEach(genre => {
                    const genreSpan = document.createElement('span');
                    genreSpan.className = 'genre-tag';
                    genreSpan.textContent = genre.name;
                    modalGenres.appendChild(genreSpan);
                });
            }
        } catch (e) {
            console.error('Error parsing genres:', e);
        }
        
        // Set active tab
        const tabs = modal.querySelectorAll('.tab-button');
        const tabPanes = modal.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        document.querySelector(`[data-tab="${activeTab}"]`).classList.add('active');
        document.getElementById(`${activeTab}-tab`).classList.add('active');
        
        // Show modal with animation
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
    
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Tab functionality for modal
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and panes
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Add active class to clicked tab and corresponding pane
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Event listeners for movie cards in the homepage
    const movieCards = document.querySelectorAll('.movie-card');
    
    movieCards.forEach(card => {
        const detailsButton = card.querySelector('.details-button');
        
        if (detailsButton) {
            detailsButton.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent triggering card click
                openMovieModal(this.dataset);
            });
        }
        
        // Optional: Make entire card clickable
        card.addEventListener('click', function() {
            const detailsBtn = this.querySelector('.details-button');
            if (detailsBtn) {
                openMovieModal(detailsBtn.dataset);
            }
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation classes with delay to movie cards for staggered animation
    document.querySelectorAll('.movie-card').forEach((card, index) => {
        card.style.setProperty('--index', index % 12); // Reset counter every 12 items for better visual
        card.classList.add('animate');
    });
    
    // Optional: Add parallax effect to hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            if (scrollPosition < window.innerHeight) {
                const translateY = scrollPosition * 0.4;
                heroSection.style.backgroundPositionY = `-${translateY}px`;
            }
        });
    }
});