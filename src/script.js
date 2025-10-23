// Dark Mode Toggle Functionality
(function() {
  'use strict';

  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
  const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

  // Mobile theme toggle elements
  const themeToggleBtnMobile = document.getElementById('theme-toggle-mobile');
  const themeToggleDarkIconMobile = document.getElementById('theme-toggle-dark-icon-mobile');
  const themeToggleLightIconMobile = document.getElementById('theme-toggle-light-icon-mobile');

  // Function to set theme icons
  function setThemeIcons(theme) {
    if (theme === 'dark') {
      themeToggleLightIcon.classList.remove('hidden');
      themeToggleDarkIcon.classList.add('hidden');
      themeToggleLightIconMobile.classList.remove('hidden');
      themeToggleDarkIconMobile.classList.add('hidden');
    } else {
      themeToggleDarkIcon.classList.remove('hidden');
      themeToggleLightIcon.classList.add('hidden');
      themeToggleDarkIconMobile.classList.remove('hidden');
      themeToggleLightIconMobile.classList.add('hidden');
    }
  }

  // Initialize theme icons on page load
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setThemeIcons('dark');
  } else {
    setThemeIcons('light');
  }

  // Function to toggle theme
  function toggleTheme() {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setThemeIcons('light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setThemeIcons('dark');
    }
  }

  // Toggle theme on button click (desktop)
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Toggle theme on button click (mobile)
  themeToggleBtnMobile.addEventListener('click', toggleTheme);

  // Mobile Menu Toggle Functionality
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');
  const closeIcon = document.getElementById('close-icon');

  function toggleMobileMenu() {
    mobileMenu.classList.toggle('hidden');
    menuIcon.classList.toggle('hidden');
    closeIcon.classList.toggle('hidden');
  }

  function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    menuIcon.classList.remove('hidden');
    closeIcon.classList.add('hidden');
  }

  mobileMenuToggle.addEventListener('click', toggleMobileMenu);

  // Close mobile menu when clicking on a link
  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(event) {
    const isClickInsideMenu = mobileMenu.contains(event.target);
    const isClickOnToggle = mobileMenuToggle.contains(event.target);

    if (!isClickInsideMenu && !isClickOnToggle && !mobileMenu.classList.contains('hidden')) {
      closeMobileMenu();
    }
  });

  // Smooth scroll with offset for fixed header
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href === '#' || href === '') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe all cards and sections for animation
  document.querySelectorAll('.card, article').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(el);
  });

  // Navbar scroll effect
  const nav = document.querySelector('nav');
  let lastScrollTop = 0;

  // Set initial state - no shadow
  nav.style.boxShadow = 'none';

  window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 50) {
      // Add shadow when scrolling
      nav.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
      nav.style.backdropFilter = 'blur(16px)';
    } else {
      // Remove shadow at top
      nav.style.boxShadow = 'none';
      nav.style.backdropFilter = 'blur(12px)';
    }

    lastScrollTop = scrollTop;
  }, { passive: true });

  // Preload images for better performance (if any are added later)
  const preloadImages = () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  };

  preloadImages();

  // Performance optimization: Add will-change to animated elements on interaction
  document.querySelectorAll('.btn-primary, .btn-secondary, .nav-link').forEach(el => {
    el.addEventListener('mouseenter', function() {
      this.style.willChange = 'transform';
    });

    el.addEventListener('mouseleave', function() {
      this.style.willChange = 'auto';
    });
  });

})();
