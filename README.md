Auto-Ops AI Agent 🚀

Tämä projekti on aktiivisessa kehitysvaiheessa. Core-ominaisuudet (analyysi ja generointi) toimivat, mutta käyttöliittymän hienosäätö ja virhekäsittely ovat vielä työn alla.

Auto-Ops on tekoälypohjainen työkalu, joka analysoi ohjelmistoprojekteja ja generoi automaattisesti niihin parhaiten sopivat CI/CD-putket (GitHub Actions). Projekti on rakennettu modernilla stackilla painottaen suorituskykyä, skaalautuvuutta ja käyttäjäystävällistä käyttöliittymää.

🌟 Tärkeimmät ominaisuudet

AI-analyysi: Analysoi projektin rakenteen ja teknologiat.

Automaattinen YAML-generointi: Luo täysin toimivat GitHub Actions -konfiguraatiot.

Interaktiivinen käyttöliittymä: Moderni, tumma teema (GitHub-tyylinen) analyysin tarkasteluun.

Askel-askeleelta ohjeet: AI tuottaa selkeät ohjeet CI/CD-putken käyttöönottoon.

Docker-pohjainen kehitysympäristö: Helppo pystytys yhdellä komennolla.

🛠 Teknologiat

Frontend

React 18 (TypeScript)

Vite (Erittäin nopea kehitysympäristö)

Tailwind CSS (Moderni ja responsiivinen tyylittely)

React Markdown & Prism (Analyysin ja koodin visualisointi)

Backend

FastAPI (Python) – Suorituskykyinen ja moderni API-kehys

Google Gemini AI API – Kehittynyt kielimalli analyysia varten

Pydantic – Datan validointi

Infrastruktuuri

Docker & Docker Compose – Kontitus ja ympäristön hallinta

Firestore – (Valmius datan persistenssille)

🚀 Aloitus

Esivaatimukset

Docker ja Docker Compose asennettuna.

API-avain Google Gemini -palveluun.

Asennus

Kloonaa repo:

git clone [https://github.com/kayttaja/auto-ops-agent.git](https://github.com/kayttaja/auto-ops-agent.git)
cd auto-ops-agent


Ympäristömuuttujat:
Luo .env -tiedosto backend-kansioon:

GEMINI_API_KEY=sinun_api_avaimesi


Käynnistä Dockerilla:

docker-compose up --build


Avaa selain:
Frontend löytyy osoitteesta: http://localhost:5173
Backend API: http://localhost:8000/docs


📈 Tulevaisuuden kehityskohteet (Roadmap)

[ ] Useiden eri CI/CD-alustojen tuki (GitLab CI, Azure DevOps).

[ ] Suora integraatio GitHub API:n kanssa (automaattiset Pull Requestit).

[ ] Analyysien tallentaminen käyttäjäkohtaisesti (Firestore-integraation viimeistely).

[ ] Parempi virheenkorjauslogiikka LLM-vastauksille.
