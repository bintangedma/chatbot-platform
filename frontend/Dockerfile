FROM node:18-alpine

WORKDIR /frontend

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Launch dev server mapping interface access
CMD ["npm", "run", "dev", "--", "--host"]
