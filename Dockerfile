# Use an official lightweight Node.js image as a base
FROM node:18-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the directory
COPY package*.json ./

# Install the project dependencies inside the container
RUN npm install

# Copy the rest of your application's code (like index.js)
COPY . .

# Tell Docker that the container will listen on port 3000
EXPOSE 3000

# Define the command to run your app when the container starts
CMD ["node", "index.js"]