# Stage 1: Build the React application
FROM docker.io/library/node:18-alpine as build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM docker.io/library/nginx:1.21.3-alpine

COPY --from=build /app/dist/public /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Copy and grant permissions to the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

# Set the entrypoint
CMD ["/entrypoint.sh"]
