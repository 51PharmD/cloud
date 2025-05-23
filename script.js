class FibonacciSphere {
  #points;
  get points() {
    return this.#points;
  }

  constructor(N) {
    this.#points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const radius = Math.sqrt(1 - y ** 2);
      const a = goldenAngle * i;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;

      this.#points.push([x, y, z]);
    }
  }
}

class TagsCloud {
  #root;
  #size;
  #sphere;
  #tags;
  #rotationAxis;
  #rotationAngle;
  #rotationSpeed;
  #frameRequestId;
  #autoRotate;
  #idleTime;

  constructor(root) {
    this.#root = root;
    this.#updateSize();
    this.#tags = root.querySelectorAll('.tag');
    this.#sphere = new FibonacciSphere(this.#tags.length);
    this.#rotationAxis = [1, 0, 0];
    this.#rotationAngle = 0;
    this.#rotationSpeed = 0;
    this.#autoRotate = true;
    this.#idleTime = 0;

    this.#normalizeFontSizes();
    this.#updatePositions();
    this.#initEventListeners();
    this.#root.classList.add('-loaded');
  }

  #updateSize() {
    this.#size = Math.min(this.#root.offsetWidth, this.#root.offsetHeight) * 0.9;
  }

  #normalizeFontSizes() {
    const tags = Array.from(this.#tags);
    const lengths = tags.map(tag => tag.textContent.trim().length);
    const maxLength = Math.max(...lengths);
    const minFontSize = Math.min(window.innerWidth, window.innerHeight) * 0.05;
    
    tags.forEach(tag => {
      const length = tag.textContent.trim().length;
      let scaleFactor = 1.5 - Math.log(length + 1) / Math.log(maxLength + 1);
      scaleFactor = Math.max(scaleFactor, 0.8);
      tag.dataset.size = scaleFactor.toFixed(2);
    });
  }

  #initEventListeners() {
    const resizeHandler = () => {
      this.#updateSize();
      this.#updatePositions();
    };
    
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('orientationchange', resizeHandler);
    document.addEventListener('mousemove', this.#onMouseMove.bind(this));
    document.addEventListener('touchmove', this.#onTouchMove.bind(this), { passive: true });
  }

  #updatePositions() {
    const sin = Math.sin(this.#rotationAngle);
    const cos = Math.cos(this.#rotationAngle);
    const ux = this.#rotationAxis[0];
    const uy = this.#rotationAxis[1];
    const uz = this.#rotationAxis[2];

    const rotationMatrix = [
      [
        cos + ux ** 2 * (1 - cos),
        ux * uy * (1 - cos) - uz * sin,
        ux * uz * (1 - cos) + uy * sin,
      ],
      [
        uy * ux * (1 - cos) + uz * sin,
        cos + uy ** 2 * (1 - cos),
        uy * uz * (1 - cos) - ux * sin,
      ],
      [
        uz * ux * (1 - cos) - uy * sin,
        uz * uy * (1 - cos) + ux * sin,
        cos + uz ** 2 * (1 - cos),
      ],
    ];

    const N = this.#tags.length;
    const containerWidth = this.#root.offsetWidth;
    const containerHeight = this.#root.offsetHeight;

    for (let i = 0; i < N; i++) {
      const [x, y, z] = this.#sphere.points[i];
      
      const transformedX = rotationMatrix[0][0] * x + rotationMatrix[0][1] * y + rotationMatrix[0][2] * z;
      const transformedY = rotationMatrix[1][0] * x + rotationMatrix[1][1] * y + rotationMatrix[1][2] * z;
      const transformedZ = rotationMatrix[2][0] * x + rotationMatrix[2][1] * y + rotationMatrix[2][2] * z;

      let translateX = (this.#size * transformedX) * 0.35;
      let translateY = (this.#size * transformedY) * 0.35;

      const tagRect = this.#tags[i].getBoundingClientRect();
      const maxX = (containerWidth - tagRect.width) / 2;
      const maxY = (containerHeight - tagRect.height) / 2;
      
      translateX = Math.max(-maxX, Math.min(translateX, maxX));
      translateY = Math.max(-maxY, Math.min(translateY, maxY));

      const depthScale = (transformedZ + 2) / 3;
      const lengthScale = parseFloat(this.#tags[i].dataset.size);
      const combinedScale = depthScale * lengthScale;
      const opacity = (transformedZ + 1.5) / 2.5;

      this.#tags[i].style.transform = 
        `translateX(${translateX}px) translateY(${translateY}px) scale(${combinedScale})`;
      this.#tags[i].style.opacity = opacity;
    }
  }

  #onMouseMove(e) {
    this.#autoRotate = false;
    this.#idleTime = 0;
    
    const rootRect = this.#root.getBoundingClientRect();
    const deltaX = e.clientX - (rootRect.left + this.#root.offsetWidth / 2);
    const deltaY = e.clientY - (rootRect.top + this.#root.offsetHeight / 2);
    const a = Math.atan2(deltaX, deltaY) - Math.PI / 2;
    const axis = [Math.sin(a), Math.cos(a), 0];
    const delta = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const speed = delta / Math.max(window.innerHeight, window.innerWidth) / 20;

    this.#rotationAxis = axis;
    this.#rotationSpeed = speed;
  }

  #onTouchMove(e) {
    this.#autoRotate = false;
    this.#idleTime = 0;
    
    const touch = e.touches[0];
    const rootRect = this.#root.getBoundingClientRect();
    const deltaX = touch.clientX - (rootRect.left + this.#root.offsetWidth / 2);
    const deltaY = touch.clientY - (rootRect.top + this.#root.offsetHeight / 2);
    const a = Math.atan2(deltaX, deltaY) - Math.PI / 2;
    const axis = [Math.sin(a), Math.cos(a), 0];
    const delta = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    const speed = delta / Math.max(window.innerHeight, window.innerWidth) / 20;

    this.#rotationAxis = axis;
    this.#rotationSpeed = speed;
  }

  #update() {
    this.#rotationAngle += this.#rotationSpeed;
    
    if (this.#autoRotate) {
      this.#idleTime += 0.016;
      if (this.#idleTime > 2) {
        this.#rotationSpeed = 0.005;
        this.#rotationAxis = [
          Math.sin(this.#idleTime * 0.5) * 0.5,
          Math.cos(this.#idleTime * 0.3) * 0.5,
          Math.sin(this.#idleTime * 0.2) * 0.5
        ];
      }
    }

    this.#updatePositions();
    this.#frameRequestId = requestAnimationFrame(this.#update.bind(this));
  }

  start() {
    this.#update();
  }
}

// Google Sheets integration functions
async function fetchHtmlContent(pubhtmlUrl) {
  const urlWithTimestamp = `${pubhtmlUrl}?t=${new Date().getTime()}`;
  const response = await fetch(urlWithTimestamp);
  return await response.text();
}

function parseMessagesForCloud(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('table tr');
  
  return Array.from(rows).slice(1).map(row => {
    const cells = row.querySelectorAll('td');
    return {
      message: cells[1]?.innerText.trim() || ''
    };
  });
}

function extractCloudWords(messages) {
  const cloudWords = [];
  const seenWords = new Set();
  
  messages.forEach(entry => {
    if (entry.message.startsWith('☁') && entry.message.length > 2) {
      const cleanMessage = entry.message
        .replace(/^☁\s*/, '')
        .replace(/[^\w\s\u0600-\u06FF]/gi, '')
        .trim();
      
      if (cleanMessage && !seenWords.has(cleanMessage)) {
        cloudWords.push(cleanMessage);
        seenWords.add(cleanMessage);
      }
    }
  });
  
  return cloudWords;
}

// Initialization code
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch data from Google Sheet
    const pubhtmlUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQazrkD8DxsLDMhQ4X78vjlIjq1wos7C-0dge7NDG0EBkJ7jhePsJYXCGUvMV79GaNcAa1hJYS_M-5Z/pubhtml';
    const html = await fetchHtmlContent(pubhtmlUrl);
    const messages = parseMessagesForCloud(html);
    const cloudWords = extractCloudWords(messages);

    // Get the tags container
    const tagsUl = document.querySelector('.tags');

    // Add new words from Google Sheet
    cloudWords.forEach(word => {
      const li = document.createElement('li');
      li.className = 'tag';
      li.innerHTML = `<span class="box">${word}</span>`;
      tagsUl.appendChild(li);
    });

    // Initialize cloud with all tags
    const cloud = new TagsCloud(tagsUl);
    cloud.start();

    // Interactive bubble code
    const interBubble = document.querySelector('.interactive');
    let curX = 0;
    let curY = 0;
    let tgX = 0;
    let tgY = 0;

    function moveBubble() {
      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
      requestAnimationFrame(moveBubble);
    }

    const handlePointerMove = (e) => {
      const clientX = e.clientX || (e.touches?.[0]?.clientX);
      const clientY = e.clientY || (e.touches?.[0]?.clientY);
      if (clientX && clientY) {
        tgX = clientX;
        tgY = clientY;
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    moveBubble();

  } catch (error) {
    console.error('Error initializing cloud:', error);
  }
});
