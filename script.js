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
    this.#size = this.#root.offsetWidth;
    this.#tags = root.querySelectorAll('.tag');
    this.#sphere = new FibonacciSphere(this.#tags.length);
    this.#rotationAxis = [1, 0, 0];
    this.#rotationAngle = 0;
    this.#rotationSpeed = 0;
    this.#autoRotate = true;
    this.#idleTime = 0;

    this.#updatePositions();
    this.#initEventListeners();
    this.#root.classList.add('-loaded');
  }

  #initEventListeners() {
    window.addEventListener('resize', this.#updatePositions.bind(this));
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

    for (let i = 0; i < N; i++) {
      const x = this.#sphere.points[i][0];
      const y = this.#sphere.points[i][1];
      const z = this.#sphere.points[i][2];

      const transformedX =
        rotationMatrix[0][0] * x +
        rotationMatrix[0][1] * y +
        rotationMatrix[0][2] * z;
      const transformedY =
        rotationMatrix[1][0] * x +
        rotationMatrix[1][1] * y +
        rotationMatrix[1][2] * z;
      const transformedZ =
        rotationMatrix[2][0] * x +
        rotationMatrix[2][1] * y +
        rotationMatrix[2][2] * z;

      const translateX = (this.#size * transformedX) / 2;
      const translateY = (this.#size * transformedY) / 2;
      const scale = (transformedZ + 2) / 3;
      const transform = `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`;
      const opacity = (transformedZ + 1.5) / 2.5;

      this.#tags[i].style.transform = transform;
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
    
    // Auto-rotation when idle
    if (this.#autoRotate) {
      this.#idleTime += 0.016; // ~60fps frame time
      if (this.#idleTime > 2) { // After 2 seconds idle
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

  stop() {
    cancelAnimationFrame(this.#frameRequestId);
  }
}

// Gradient Bubble Animation
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

// Initialize Everything
document.addEventListener('DOMContentLoaded', () => {
  const cloud = new TagsCloud(document.querySelector('.tags'));
  cloud.start();

  // Mouse/Touch events for gradient bubble
  const handlePointerMove = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    if (clientX && clientY) {
      tgX = clientX;
      tgY = clientY;
    }
  };

  window.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('touchmove', handlePointerMove, { passive: true });

  moveBubble();
});
