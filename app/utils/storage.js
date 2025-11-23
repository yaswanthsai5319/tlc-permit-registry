// Utility functions for localStorage operations

export const storage = {
  // Get data from localStorage
  get: (key) => {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
    return null;
  },

  // Set data to localStorage
  set: (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  // Remove item from localStorage
  remove: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  },

  // Clear all localStorage
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  }
};

// Initialize default data on first load
export const initializeData = () => {
  // Initialize users if not exists
  if (!storage.get('users')) {
    storage.set('users', [
      { username: 'user', password: 'user123', role: 'user' },
      { username: 'admin', password: 'admin123', role: 'admin' }
    ]);
  }

  // Initialize permits array if not exists
  if (!storage.get('permits')) {
    storage.set('permits', []);
  }
};