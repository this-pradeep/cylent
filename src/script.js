// Lenis Smooth Scroll Initialization
(function() {
  'use strict';

  // Wait for Lenis to load
  window.addEventListener('load', function() {
    if (typeof Lenis === 'undefined') {
      console.warn('Lenis smooth scroll library not loaded');
      return;
    }

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    // Integrate with GSAP ScrollTrigger if available
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);

      // Use GSAP ticker for RAF instead of manual RAF
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      gsap.ticker.lagSmoothing(0);
    } else {
      // Fallback: Animation frame for smooth scroll if GSAP is not available
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    }

    // Store lenis instance globally for use in other scripts
    window.lenis = lenis;
  });
})();

// Page Loader
(function() {
  'use strict';

  window.addEventListener('load', function() {
    const loader = document.getElementById('page-loader');

    if (loader) {
      // Add a minimum display time of 1 second for better UX
      setTimeout(() => {
        loader.style.opacity = '0';

        // Remove the loader from DOM after fade out
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 1000);
    }
  });
})();

// Hero Typewriter Animation
(function() {
  'use strict';

  // Wait for GSAP to load
  window.addEventListener('load', function() {
    if (typeof gsap === 'undefined') {
      console.error('GSAP not loaded');
      return;
    }

    gsap.registerPlugin(TextPlugin);

    const typewriterText = document.getElementById('typewriter-text');
    const typewriterCursor = document.getElementById('typewriter-cursor');
    const heroSubtitle = document.getElementById('hero-subtitle');
    const heroButtons = document.getElementById('hero-buttons');

    const words = ['Build.', 'Scale.', 'Deploy.', 'Innovate.'];

    // Show subtitle and buttons after a short delay (only once)
    gsap.to(heroSubtitle, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.5,
      ease: 'power2.out'
    });

    gsap.to(heroButtons, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: 0.8,
      ease: 'power2.out'
    });

    // Function to create the typing animation
    function createTypewriterTimeline() {
      const timeline = gsap.timeline({
        repeat: -1, // Loop infinitely
        repeatDelay: 1 // Pause before restarting the loop
      });

      // Type each word
      words.forEach((word, index) => {
        // Type the word
        timeline.to(typewriterText, {
          duration: word.length * 0.1,
          text: word,
          ease: 'none'
        });

        // Pause after typing
        timeline.to({}, { duration: 1.2 });

        // Delete the word (pause before deletion + deletion time)
        timeline.to(typewriterText, {
          duration: word.length * 0.05,
          text: '',
          ease: 'none',
          delay: 0.5
        });

        // Small pause before next word
        if (index < words.length - 1) {
          timeline.to({}, { duration: 0.3 });
        }
      });

      return timeline;
    }

    // Start the animation
    createTypewriterTimeline();
  });
})();

// Custom Cursor Functionality
(function() {
  'use strict';

  // Only run on desktop devices
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (!isTouchDevice) {
    const cursor = document.getElementById('cursor');
    const cursorFollower = document.getElementById('cursor-follower');

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;

    // Function to update cursor image based on theme
    function updateCursorTheme() {
      const isDark = document.documentElement.classList.contains('dark');
      const cursorImage = isDark ? '../src/img/cursor_dark.svg' : '../src/img/cursor_light.svg';
      cursor.style.backgroundImage = `url('${cursorImage}')`;
    }

    // Function to update hand cursor image based on theme
    function updateHandCursorTheme() {
      const isDark = document.documentElement.classList.contains('dark');
      const handCursorImage = isDark ? '../src/img/hand_cursor_dark.svg' : '../src/img/hand_cursor_light.svg';
      cursor.style.backgroundImage = `url('${handCursorImage}')`;
    }

    // Set initial cursor image
    updateCursorTheme();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      // If currently on a link, update to hand cursor, otherwise regular cursor
      if (document.body.classList.contains('cursor-link')) {
        updateHandCursorTheme();
      } else {
        updateCursorTheme();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Initialize cursor position
    cursor.style.left = '0px';
    cursor.style.top = '0px';
    cursorFollower.style.left = '0px';
    cursorFollower.style.top = '0px';

    // Smooth cursor animation
    function animateCursor() {
      // Cursor follows immediately with the image
      const cursorSpeed = 0.15;
      cursorX += (mouseX - cursorX) * cursorSpeed;
      cursorY += (mouseY - cursorY) * cursorSpeed;

      // Follower has a delay
      const followerSpeed = 0.1;
      followerX += (mouseX - followerX) * followerSpeed;
      followerY += (mouseY - followerY) * followerSpeed;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursorFollower.style.left = followerX + 'px';
      cursorFollower.style.top = followerY + 'px';

      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    // Link and button elements - special hand cursor
    const clickableElements = document.querySelectorAll('a, .nav-link, button, .btn-primary, .btn-secondary, [role="button"]');

    clickableElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-link');
        document.body.classList.remove('cursor-hover', 'cursor-text');
        cursor.innerHTML = '';
        updateHandCursorTheme();
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-link');
        cursor.innerHTML = '';
        updateCursorTheme();
      });
    });

    // Other interactive elements - regular hover (inputs, textareas, selects, cards)
    const interactiveElements = document.querySelectorAll(
      '.card, input, textarea, select'
    );

    // Add hover state
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
        document.body.classList.remove('cursor-text');
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
      });
    });

    // Add active state on click
    document.addEventListener('mousedown', () => {
      document.body.classList.add('cursor-active');
    });

    document.addEventListener('mouseup', () => {
      document.body.classList.remove('cursor-active');
    });

    // Text selection state
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, li');

    textElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        if (!el.closest('a, button')) {
          document.body.classList.add('cursor-text');
          cursor.innerHTML = '';
          cursor.style.backgroundImage = 'none';
        }
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-text');
        cursor.innerHTML = '';
        updateCursorTheme();
      });
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      document.body.classList.add('cursor-hidden');
    });

    document.addEventListener('mouseenter', () => {
      document.body.classList.remove('cursor-hidden');
    });
  }
})();

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

  // Smooth scroll with offset for fixed header (integrated with Lenis)
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

        // Use Lenis if available, otherwise fallback to native smooth scroll
        if (window.lenis) {
          window.lenis.scrollTo(offsetPosition, {
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
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

  // Text Reveal Animation for Section Headings
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Function to split text into words and characters while preserving structure
    function splitText(element) {
      // Store the original HTML to parse it properly
      const processNode = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim();
          if (!text) return null;

          const words = text.split(/\s+/);
          const fragment = document.createDocumentFragment();

          words.forEach((word, wordIndex) => {
            if (!word) return;

            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';

            // Split word into characters
            const chars = word.split('');
            chars.forEach((char) => {
              const charSpan = document.createElement('span');
              charSpan.className = 'char';
              charSpan.textContent = char;
              wordSpan.appendChild(charSpan);
            });

            fragment.appendChild(wordSpan);
          });

          return fragment;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const newNode = node.cloneNode(false);

          // Handle br tags
          if (node.tagName === 'BR') {
            return node.cloneNode(true);
          }

          // Handle span tags (like italic, font-light)
          if (node.tagName === 'SPAN') {
            const classes = node.className;
            Array.from(node.childNodes).forEach(child => {
              const processed = processNode(child);
              if (processed) {
                if (processed.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                  // Add classes to each word within this span
                  Array.from(processed.children).forEach(wordSpan => {
                    if (wordSpan.className === 'word') {
                      wordSpan.className = `word ${classes}`;
                    }
                  });
                }
                newNode.appendChild(processed);
              }
            });
            return newNode;
          }

          // For other elements, process children
          Array.from(node.childNodes).forEach(child => {
            const processed = processNode(child);
            if (processed) {
              newNode.appendChild(processed);
            }
          });

          return newNode;
        }
        return null;
      };

      // Clear and rebuild
      const fragment = document.createDocumentFragment();
      Array.from(element.childNodes).forEach(child => {
        const processed = processNode(child);
        if (processed) {
          fragment.appendChild(processed);
        }
      });

      element.innerHTML = '';
      element.appendChild(fragment);
    }

    // Apply text reveal animation to all section headings with class
    document.querySelectorAll('.reveal-heading').forEach((heading) => {
      splitText(heading);

      const chars = heading.querySelectorAll('.char');

      // Create the reveal animation
      gsap.fromTo(chars,
        {
          y: '120%',
          opacity: 0,
          rotationX: -90,
        },
        {
          y: '0%',
          opacity: 1,
          rotationX: 0,
          duration: 0.8,
          ease: 'power4.out',
          stagger: {
            amount: 0.5,
            from: 'start',
          },
          scrollTrigger: {
            trigger: heading,
            start: 'top 80%',
            end: 'top 50%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
  }

  // Portfolio Category Filtering
  const categoryButtons = document.querySelectorAll('.category-filter-btn');
  const projectItems = document.querySelectorAll('.project-item');

  categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.getAttribute('data-category');

      // Remove active class from all buttons
      categoryButtons.forEach(btn => btn.classList.remove('active'));

      // Add active class to clicked button
      this.classList.add('active');

      // Filter projects
      projectItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');

        if (category === 'all' || itemCategory === category) {
          // Show the item with animation
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 10);
        } else {
          // Hide the item with animation
          item.style.opacity = '0';
          item.style.transform = 'scale(0.9)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });
    });
  });

})();
