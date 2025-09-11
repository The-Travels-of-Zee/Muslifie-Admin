export const authUtils = {
    setToken(token) {
      localStorage.setItem('adminToken', token);
    },
  
    getToken() {
      return localStorage.getItem('adminToken');
    },
  
    removeToken() {
      localStorage.removeItem('adminToken');
    },
  
    isAuthenticated() {
      return !!this.getToken();
    },
  
    setUser(user) {
      localStorage.setItem('adminUser', JSON.stringify(user));
    },
  
    getUser() {
      const user = localStorage.getItem('adminUser');
      return user ? JSON.parse(user) : null;
    },
  
    removeUser() {
      localStorage.removeItem('adminUser');
    },
  
    logout() {
      this.removeToken();
      this.removeUser();
      window.location.href = '/login';
    }
  };