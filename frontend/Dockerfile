# Serve the pre-built React application with Nginx
FROM docker.io/library/nginx:1.21.3-alpine

# Copy the pre-built dist/public folder directly from the host context
COPY dist/public /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
