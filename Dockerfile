FROM node:14

WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Ensure the public directory exists
RUN mkdir -p public

# Copy the audio file to the public directory
COPY public/abridged_tim0.mp3 public/

# Expose the port your app runs on
EXPOSE 8080

# Start the app
CMD ["npm", "start"]