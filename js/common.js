/**
 * 공통 유틸리티 - 네비게이션, 포맷팅, localStorage, 툴팁
 */

const APP = {
  // ============================================
  // 네비게이션
  // ============================================
  nav: {
    items: [
      { label: '대시보드', href: '/index.html', icon: '📊' },
      { label: '국민연금', href: '/pages/national-pension.html', icon: '🏛️' },
      { label: '퇴직연금', href: '/pages/retirement-pension.html', icon: '💼' },
      { label: '개인연금', href: '/pages/personal-pension.html', icon: '💰' },
      { label: '절세 전략', href: '/pages/tax-strategy.html', icon: '📋' },
      { label: '건강보험료', href: '/pages/health-insurance.html', icon: '🏥' },
      { label: '노후자금', href: '/pages/retirement-fund.html', icon: '🏦' },
      { label: '체크리스트', href: '/pages/checklist.html', icon: '✅' },
    ],

    /** 네비게이션 HTML 생성 */
    render() {
      const currentPath = window.location.pathname;
      const basePath = this.getBasePath();

      const navHTML = this.items.map(item => {
        const fullHref = basePath + item.href;
        const isActive = currentPath.endsWith(item.href) ||
          (item.href === '/index.html' && (currentPath.endsWith('/') || currentPath.endsWith('/index.html')));
        return `<a href="${fullHref}" class="nav-item ${isActive ? 'active' : ''}" title="${item.label}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </a>`;
      }).join('');

      const nav = document.getElementById('main-nav');
      if (nav) {
        nav.innerHTML = `
          <div class="nav-brand" onclick="location.href='${basePath}/index.html'">
            <span class="brand-icon">🧮</span>
            <span class="brand-text">연금 포털</span>
          </div>
          <button class="nav-toggle" onclick="APP.nav.toggle()" aria-label="메뉴 열기">
            <span></span><span></span><span></span>
          </button>
          <div class="nav-links-wrap">
            <div class="nav-links">${navHTML}</div>
          </div>
        `;

        // 스크롤 힌트 감지
        this.checkOverflow();
      }
    },

    /** 네비게이션 가로 스크롤 힌트 */
    checkOverflow() {
      const wrap = document.querySelector('.nav-links-wrap');
      const links = document.querySelector('.nav-links');
      if (!wrap || !links) return;

      const update = () => {
        const hasMore = links.scrollWidth > links.clientWidth &&
          links.scrollLeft + links.clientWidth < links.scrollWidth - 4;
        wrap.classList.toggle('has-overflow', hasMore);
      };

      links.addEventListener('scroll', update);
      window.addEventListener('resize', update);
      update();
    },

    getBasePath() {
      const path = window.location.pathname;
      if (path.includes('/pages/')) {
        return path.substring(0, path.indexOf('/pages/'));
      }
      const idx = path.lastIndexOf('/');
      return path.substring(0, idx);
    },

    toggle() {
      const links = document.querySelector('.nav-links');
      if (links) links.classList.toggle('open');
    },
  },

  // ============================================
  // 숫자 포맷팅
  // ============================================
  format: {
    /** 숫자에 천단위 콤마 */
    number(num) {
      if (num === null || num === undefined || isNaN(num)) return '0';
      return Math.round(num).toLocaleString('ko-KR');
    },

    /** 금액 표시 (만원 단위) */
    manwon(num) {
      if (!num || isNaN(num)) return '0만원';
      const man = num / 10000;
      if (man >= 10000) {
        const eok = Math.floor(man / 10000);
        const remain = Math.round(man % 10000);
        return remain > 0 ? `${eok}억 ${this.number(remain)}만원` : `${eok}억원`;
      }
      return `${this.number(Math.round(man))}만원`;
    },

    /** 금액 표시 (원 단위) */
    won(num) {
      if (!num || isNaN(num)) return '0원';
      return this.number(num) + '원';
    },

    /** 퍼센트 */
    percent(num, decimals = 1) {
      if (!num || isNaN(num)) return '0%';
      return (num * 100).toFixed(decimals) + '%';
    },

    /** 나이 */
    age(num) {
      return num + '세';
    },
  },

  // ============================================
  // 입력 필드 관리
  // ============================================
  input: {
    /** 금액 입력 필드에 천단위 콤마 자동 적용 */
    initMoneyFields() {
      document.querySelectorAll('input[data-type="money"]').forEach(input => {
        input.addEventListener('input', (e) => {
          let value = e.target.value.replace(/[^0-9]/g, '');
          if (value) {
            e.target.value = Number(value).toLocaleString('ko-KR');
          }
        });

        input.addEventListener('focus', (e) => {
          let value = e.target.value.replace(/[^0-9]/g, '');
          if (value === '0') e.target.value = '';
        });
      });
    },

    /** range 슬라이더 채움 트랙 초기화 */
    initRangeFields() {
      const updateFill = (range) => {
        const min = Number(range.min) || 0;
        const max = Number(range.max) || 100;
        const val = Number(range.value) || 0;
        const pct = ((val - min) / (max - min)) * 100;
        range.style.backgroundSize = pct + '% 100%';
      };

      document.querySelectorAll('.form-range').forEach(range => {
        updateFill(range);
        range.addEventListener('input', () => updateFill(range));
      });
    },

    /** 금액 입력에서 숫자만 추출 */
    getMoneyValue(selector) {
      const el = document.querySelector(selector);
      if (!el) return 0;
      return Number(el.value.replace(/[^0-9]/g, '')) || 0;
    },

    /** 일반 숫자 입력에서 값 추출 */
    getNumber(selector) {
      const el = document.querySelector(selector);
      if (!el) return 0;
      return Number(el.value) || 0;
    },

    /** 선택값 추출 */
    getSelect(selector) {
      const el = document.querySelector(selector);
      if (!el) return '';
      return el.value;
    },
  },

  // ============================================
  // localStorage 관리
  // ============================================
  storage: {
    PREFIX: 'pension_portal_',

    save(key, data) {
      try {
        localStorage.setItem(this.PREFIX + key, JSON.stringify(data));
      } catch (e) {
        console.warn('localStorage 저장 실패:', e);
      }
    },

    load(key) {
      try {
        const data = localStorage.getItem(this.PREFIX + key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.warn('localStorage 로드 실패:', e);
        return null;
      }
    },

    remove(key) {
      localStorage.removeItem(this.PREFIX + key);
    },

    /** 폼 데이터 자동 저장 */
    saveForm(formId) {
      const form = document.getElementById(formId);
      if (!form) return;

      const data = {};
      form.querySelectorAll('input, select').forEach(el => {
        if (el.name) {
          data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
        }
      });
      this.save('form_' + formId, data);
    },

    /** 폼 데이터 복원 */
    restoreForm(formId) {
      const data = this.load('form_' + formId);
      if (!data) return;

      const form = document.getElementById(formId);
      if (!form) return;

      Object.entries(data).forEach(([name, value]) => {
        const el = form.querySelector(`[name="${name}"]`);
        if (!el) return;
        if (el.type === 'checkbox') {
          el.checked = value;
        } else {
          el.value = value;
        }
        // 콤마 포맷 복원
        if (el.dataset.type === 'money' && value) {
          const num = Number(String(value).replace(/[^0-9]/g, ''));
          if (num) el.value = num.toLocaleString('ko-KR');
        }
        // range 슬라이더 복원 시 oninput 트리거
        if (el.type === 'range') {
          el.dispatchEvent(new Event('input'));
        }
      });
    },
  },

  // ============================================
  // 툴팁
  // ============================================
  tooltip: {
    init() {
      document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', (e) => this.show(e));
        el.addEventListener('mouseleave', () => this.hide());
        el.addEventListener('click', (e) => this.show(e));  // 모바일 대응
      });
    },

    show(e) {
      this.hide();
      const text = e.target.getAttribute('data-tooltip');
      const tip = document.createElement('div');
      tip.className = 'tooltip-popup';
      tip.textContent = text;
      document.body.appendChild(tip);

      const rect = e.target.getBoundingClientRect();
      tip.style.top = (rect.bottom + window.scrollY + 8) + 'px';
      tip.style.left = Math.max(10, rect.left + rect.width / 2 - tip.offsetWidth / 2) + 'px';
    },

    hide() {
      document.querySelectorAll('.tooltip-popup').forEach(el => el.remove());
    },
  },

  // ============================================
  // 차트 유틸
  // ============================================
  chart: {
    instances: {},

    /** 차트 생성 (기존 차트 파괴 후 재생성) */
    create(canvasId, config) {
      if (this.instances[canvasId]) {
        this.instances[canvasId].destroy();
      }
      const ctx = document.getElementById(canvasId);
      if (!ctx) return null;

      // 기본 스타일 적용
      config.options = config.options || {};
      config.options.responsive = true;
      config.options.maintainAspectRatio = false;
      config.options.plugins = config.options.plugins || {};
      config.options.plugins.legend = config.options.plugins.legend || {
        labels: { font: { size: 14 } }
      };

      this.instances[canvasId] = new Chart(ctx.getContext('2d'), config);
      return this.instances[canvasId];
    },

    colors: {
      primary: '#1B5E7B',
      secondary: '#2E8B57',
      accent: '#E8890C',
      danger: '#DC3545',
      info: '#17A2B8',
      light: '#F8F9FA',
      primaryAlpha: 'rgba(27, 94, 123, 0.2)',
      secondaryAlpha: 'rgba(46, 139, 87, 0.2)',
      accentAlpha: 'rgba(232, 137, 12, 0.2)',
      dangerAlpha: 'rgba(220, 53, 69, 0.2)',
      palette: [
        '#1B5E7B', '#2E8B57', '#E8890C', '#DC3545',
        '#17A2B8', '#6F42C1', '#FD7E14', '#20C997'
      ],
    },
  },

  // ============================================
  // 면책조항
  // ============================================
  disclaimer: {
    render() {
      const footer = document.getElementById('footer');
      if (!footer) return;
      footer.innerHTML = `
        <div class="disclaimer">
          <p><strong>면책조항</strong></p>
          <p>본 사이트의 계산 결과는 참고용이며, 실제 금액과 차이가 있을 수 있습니다.</p>
          <p>정확한 금액은 국민연금공단(1355), 국세청(126), 건강보험공단(1577-1000)에 문의하시기 바랍니다.</p>
          <p class="disclaimer-meta">데이터 기준: ${CONSTANTS.COMMON.DATA_YEAR} | 최종 업데이트: ${CONSTANTS.COMMON.LAST_UPDATED}</p>
        </div>
      `;
    },
  },

  // ============================================
  // 폼 유효성 검사
  // ============================================
  validate: {
    showError(input, message) {
      if (typeof input === 'string') input = document.querySelector(input);
      if (!input) return;
      input.classList.add('error');
      let errEl = input.parentElement.querySelector('.form-error');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'form-error';
        input.parentElement.appendChild(errEl);
      }
      errEl.textContent = message;
      errEl.classList.add('show');
    },

    clearError(input) {
      if (typeof input === 'string') input = document.querySelector(input);
      if (!input) return;
      input.classList.remove('error');
      const errEl = input.parentElement.querySelector('.form-error');
      if (errEl) errEl.classList.remove('show');
    },

    /** 값이 min~max 범위인지 검사. 실패 시 에러 표시 후 false 반환 */
    minMax(input, min, max, msg) {
      if (typeof input === 'string') input = document.querySelector(input);
      if (!input) return false;
      const val = Number(input.value) || 0;
      if (val < min || val > max) {
        this.showError(input, msg);
        return false;
      }
      this.clearError(input);
      return true;
    },

    required(input, msg) {
      if (typeof input === 'string') input = document.querySelector(input);
      if (!input) return false;
      if (!input.value || !input.value.trim()) {
        this.showError(input, msg);
        return false;
      }
      this.clearError(input);
      return true;
    },
  },

  // ============================================
  // 버튼 로딩 상태
  // ============================================
  button: {
    loading(btn, text) {
      if (typeof btn === 'string') btn = document.querySelector(btn);
      if (!btn) return;
      btn._origText = btn.textContent;
      btn.textContent = text || '계산 중...';
      btn.classList.add('loading');
    },

    reset(btn) {
      if (typeof btn === 'string') btn = document.querySelector(btn);
      if (!btn) return;
      btn.textContent = btn._origText || '계산하기';
      btn.classList.remove('loading');
    },
  },

  // ============================================
  // 초기화
  // ============================================
  init() {
    this.nav.render();
    this.input.initMoneyFields();
    this.input.initRangeFields();
    this.tooltip.init();
    this.disclaimer.render();

    // 링크 클릭 시 모바일 네비 닫기
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#main-nav')) {
        const links = document.querySelector('.nav-links');
        if (links) links.classList.remove('open');
      }
    });
  },
};

// DOM 로드 후 초기화
document.addEventListener('DOMContentLoaded', () => APP.init());
