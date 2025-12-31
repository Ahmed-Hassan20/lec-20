let products = [];

async function fetchProducts() {
  try {
    const response = await fetch('https://dummyjson.com/products/category/smartphones?limit=8');
    const data = await response.json();
    
    products = data.products.map(product => {
      // Calculate old price based on discount
      const discount = product.discountPercentage || 0;
      const oldPrice = discount > 0 
        ? Math.round(product.price / (1 - discount / 100)) 
        : product.price;

      return {
        id: product.id,
        slug: product.title.toLowerCase().replace(/\s+/g, '-'),
        title: product.title,
        description: product.description,
        image: product.thumbnail,
        old_price: oldPrice,
        price_after_sale: product.price,
        currency: "USD"
      };
    });
    
    displayProducts();
  } catch (error) {
    console.error('Error fetching products:', error);
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
        productsGrid.innerHTML = '<p class="no-results">Failed to load products. Please try again later.</p>';
    }
  }
}

// Cart and Wishlist arrays to store product IDs
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = [];

// Update the cart badge in navbar
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  badge.textContent = cart.length;
  
  if (cart.length === 0) {
    badge.classList.add('hidden');
  } else {
    badge.classList.remove('hidden');
  }
}

// Toggle cart item
function toggleCart(productId) {
  const index = cart.indexOf(productId);
  
  if (index === -1) {
    // Add to cart
    cart.push(productId);
  } else {
    // Remove from cart
    cart.splice(index, 1);
  }
  
  updateCartBadge();
  updateCartButton(productId);
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart button appearance
function updateCartButton(productId) {
  const card = document.querySelector(`.card[data-id="${productId}"]`);
  if (!card) return;
  
  const addBtn = card.querySelector('.btn.add');
  const btnText = addBtn.querySelector('.btn-text');
  const isInCart = cart.includes(productId);
  
  if (isInCart) {
    addBtn.classList.add('in-cart');
    btnText.textContent = 'Remove from cart';
    addBtn.setAttribute('aria-label', 'Remove from cart');
  } else {
    addBtn.classList.remove('in-cart');
    btnText.textContent = 'Add to cart';
    addBtn.setAttribute('aria-label', 'Add to cart');
  }
}

// Toggle wishlist item
function toggleWishlist(productId) {
  const index = wishlist.indexOf(productId);
  
  if (index === -1) {
    // Add to wishlist
    wishlist.push(productId);
  } else {
    // Remove from wishlist
    wishlist.splice(index, 1);
  }
  
  updateWishlistButton(productId);
}

// Update wishlist button appearance
function updateWishlistButton(productId) {
  const card = document.querySelector(`.card[data-id="${productId}"]`);
  if (!card) return;
  
  const wishBtn = card.querySelector('.btn.wish');
  const isInWishlist = wishlist.includes(productId);
  
  if (isInWishlist) {
    wishBtn.classList.add('active');
    wishBtn.setAttribute('aria-label', 'Remove from wishlist');
  } else {
    wishBtn.classList.remove('active');
    wishBtn.setAttribute('aria-label', 'Add to wishlist');
  }
}

function getCardTemplate() {
  const template = document.getElementById('card-template');
  return template.content.querySelector('.card');
}


function createProductCard(template, product) {
  const card = template.cloneNode(true);
  
  // Set data-id for tracking
  card.setAttribute('data-id', product.id);
  
  const image = card.querySelector('.card-media img');
  image.src = product.image;
  image.alt = product.title;
  
  const title = card.querySelector('.product-title');
  title.textContent = product.title;
  
  const description = card.querySelector('.product-desc');
  description.textContent = product.description;
  
  const price = card.querySelector('.price');
  price.textContent = '$' + product.price_after_sale;
  
  const oldPrice = card.querySelector('.old-price');
  oldPrice.textContent = '$' + product.old_price;
  
  // Add cart button event listener
  const addBtn = card.querySelector('.btn.add');
  addBtn.addEventListener('click', function() {
    toggleCart(product.id);
  });
  
  // Add wishlist button event listener
  const wishBtn = card.querySelector('.btn.wish');
  wishBtn.addEventListener('click', function() {
    toggleWishlist(product.id);
  });
  
  return card;
}

function displayProducts(filteredProducts) {
  const template = getCardTemplate();
  const productsGrid = document.querySelector('.products-grid');
  
  // Clear existing products
  productsGrid.innerHTML = '';
  
  // Use filtered products if provided, otherwise use all products
  const productsToDisplay = filteredProducts || products;
  
  if (productsToDisplay.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'no-results';
    noResults.textContent = 'No products found matching your criteria.';
    productsGrid.appendChild(noResults);
    return;
  }
  
  for (let i = 0; i < productsToDisplay.length; i++) {
    const product = productsToDisplay[i];
    const card = createProductCard(template, product);
    productsGrid.appendChild(card);
    
    // Update button states based on cart/wishlist
    if (cart.includes(product.id)) {
      updateCartButton(product.id);
    }
    if (wishlist.includes(product.id)) {
      updateWishlistButton(product.id);
    }
  }
}

// Validate search input
function validateSearchInput(searchText) {
  if (searchText.trim() === '') {
    alert('Please enter a search term. Empty or whitespace-only input is not allowed.');
    return false;
  }
  return true;
}

// Validate price inputs
function validatePriceInputs(minPrice, maxPrice, minInput, maxInput) {
  // Check if at least one price is entered
  if (minInput === '' && maxInput === '') {
    alert('Please enter at least a minimum or maximum price.');
    return false;
  }
  
  // Check for negative values
  if (minPrice < 0) {
    alert('Minimum price cannot be negative. Please enter a positive number.');
    return false;
  }
  
  if (maxPrice < 0) {
    alert('Maximum price cannot be negative. Please enter a positive number.');
    return false;
  }
  
  // Check if max is greater than min (only if both are provided)
  if (minInput !== '' && maxInput !== '' && maxPrice <= minPrice) {
    alert('Maximum price must be greater than minimum price.');
    return false;
  }
  
  return true;
}

function filterBySearch() {
  const searchInput = document.getElementById('search-input');
  const searchText = searchInput.value;
  
  // Validate input
  if (!validateSearchInput(searchText)) {
    return;
  }
  
  const filteredProducts = products.filter(function(product) {
    return product.title.toLowerCase().includes(searchText.trim().toLowerCase());
  });
  
  displayProducts(filteredProducts);
}

function filterByPrice() {
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  
  const minValue = minPriceInput.value;
  const maxValue = maxPriceInput.value;
  
  const minPrice = minValue !== '' ? parseFloat(minValue) : 0;
  const maxPrice = maxValue !== '' ? parseFloat(maxValue) : Infinity;
  
  // Validate inputs
  if (!validatePriceInputs(minPrice, maxPrice, minValue, maxValue)) {
    return;
  }
  
  const filteredProducts = products.filter(function(product) {
    return product.price_after_sale >= minPrice && product.price_after_sale <= maxPrice;
  });
  
  displayProducts(filteredProducts);
}

// Countdown Timer Logic
function startTimer() {
  let hours = 7;
  let minutes = 23;
  let seconds = 45;

  const hoursElement = document.getElementById('hours');
  const minutesElement = document.getElementById('minutes');
  const secondsElement = document.getElementById('seconds');

  function updateDisplay() {
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
  }

  const timerInterval = setInterval(function() {
    if (seconds > 0) {
      seconds--;
    } else {
      if (minutes > 0) {
        minutes--;
        seconds = 59;
      } else {
        if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          clearInterval(timerInterval);
          // Timer finished
        }
      }
    }
    updateDisplay();
  }, 1000);
  
  // Initial display
  updateDisplay();
}

document.addEventListener('DOMContentLoaded', function() {
  fetchProducts();
  updateCartBadge();
  startTimer();
  
  // Search button click handler
  const searchBtn = document.getElementById('search-btn');
  searchBtn.addEventListener('click', filterBySearch);
  
  // Filter button click handler
  const filterBtn = document.getElementById('filter-btn');
  filterBtn.addEventListener('click', filterByPrice);
  
  // Allow Enter key to trigger search
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      filterBySearch();
    }
  });
});