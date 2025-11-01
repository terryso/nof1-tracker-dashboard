// Client-side authentication helper
// This file is separate and won't conflict with upstream merges

(function() {
    console.log('Auth client loading...');

    // Check if user is authenticated
    function checkAuth() {
        const token = localStorage.getItem('authToken');
        console.log('Checking auth, token present:', !!token);

        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = '/login.html';
            return;
        }

        console.log('Token found, setting up fetch interceptor');

        // Add token to all API requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const [url, options = {}] = args;

            // Add auth header to API requests
            if (url.startsWith('/api/') && !url.includes('/api/login')) {
                options.headers = options.headers || {};
                options.headers['X-Auth-Token'] = token;
                console.log('Adding auth token to request:', url);
            }

            return originalFetch(url, options).then(response => {
                // If unauthorized, redirect to login
                if (response.status === 401) {
                    console.log('Got 401, removing token and redirecting');
                    localStorage.removeItem('authToken');
                    window.location.href = '/login.html';
                }
                return response;
            }).catch(error => {
                console.error('Fetch error:', error);
                throw error;
            });
        };

        console.log('Auth setup complete');
    }

    // Add logout function
    window.logout = function() {
        console.log('Logging out...');
        localStorage.removeItem('authToken');
        window.location.href = '/login.html';
    };

    // Run auth check when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
})();