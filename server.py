
#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, unquote

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        # Handle root path
        if path == '/' or path == '':
            self.path = '/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa/index.html'
        # Handle admin access
        elif path == '/admin':
            self.path = '/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa/admin.html'
        # Handle product pages
        elif path == '/products':
            self.path = '/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa/products.html'
        # Handle order tracking
        elif path == '/track-order' or path == '/track':
            self.path = '/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa/track-order.html'
        # Handle policy pages
        elif path in ['/return-policy', '/refund-policy', '/rules']:
            self.path = f'/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa{path}.html'
        # Handle static files
        elif path.startswith('/GlobalSyncGifts/'):
            self.path = path
        else:
            # Default to serve from the website directory
            self.path = f'/GlobalSyncGifts/aaaaaaaaaaaaaaaaaaaaaa{path}'
        
        return super().do_GET()

def run_server():
    PORT = 5000
    
    # Stay in root directory to serve all files
    print(f"🚀 TryneX Lifestyle server starting...")
    print(f"📂 Serving from: {os.getcwd()}")
    
    # Create server
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🌐 TryneX Lifestyle server running at http://0.0.0.0:{PORT}")
        print(f"📱 Access your website at the provided URL")
        print(f"🔧 Admin panel: Go to website footer and triple-click the gear icon")
        print(f"🛑 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            sys.exit(0)

if __name__ == "__main__":
    run_server()
