// Import testing-library utilities
import '@testing-library/jest-dom';

// Mock browser APIs not available in jest-dom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

// Mock Intersection Observer
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [0],
}));

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
    readText: jest.fn(),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
      window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
      window.dispatchEvent(new Event('localProfileUpdate'));
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.history methods
window.history.replaceState = jest.fn();
window.history.pushState = jest.fn();

// Mock URL and URLSearchParams
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Mock for react-query
jest.mock('@tanstack/react-query', () => {
  const originalModule = jest.requireActual('@tanstack/react-query');
  return {
    ...originalModule,
    useQuery: jest.fn().mockImplementation(() => ({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    })),
    useQueryClient: jest.fn().mockImplementation(() => ({
      invalidateQueries: jest.fn(),
      getQueryCache: jest.fn().mockReturnValue({
        subscribe: jest.fn().mockReturnValue(jest.fn()), // Returns unsubscribe function
      }),
    })),
  };
});

// Mock the config module to handle import.meta.env
jest.mock('../client/src/lib/config.js', () => ({
  __esModule: true,
  default: {
    groqApiKey: 'test-groq-api-key',
    apiBaseUrl: 'http://localhost:8000'
  }
}));

// Mock userEvent setup function to avoid clipboard issues
jest.mock('@testing-library/user-event', () => {
  const actual = jest.requireActual('@testing-library/user-event');
  return {
    ...actual,
    setup: () => ({
      click: jest.fn().mockImplementation(async (element) => {
        element.click();
        return Promise.resolve();
      }),
      clear: jest.fn().mockImplementation(async (element) => {
        element.value = '';
        return Promise.resolve();
      }),
      type: jest.fn().mockImplementation(async (element, text) => {
        element.value = text;
        return Promise.resolve();
      })
    })
  };
}); 