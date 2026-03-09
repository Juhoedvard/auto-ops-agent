# 1. Käytetään kevyttä Node-imagea
FROM node:20-slim

# 2. Asetetaan työkansio kontin sisällä
WORKDIR /app

# 3. Kopioidaan pakettilistat ensin (optimoi välimuistin käyttöä)
COPY package*.json ./

# 4. Asennetaan riippuvuudet
RUN npm install

# 5. Kopioidaan loput tiedostot
COPY . .

# 6. Avataan portti 5173 (Viten oletus)
EXPOSE 5173

# 7. Käynnistyskomento (Vite tarvitsee --host-lipun Dockerissa)
CMD ["npm", "run", "dev", "--", "--host"]