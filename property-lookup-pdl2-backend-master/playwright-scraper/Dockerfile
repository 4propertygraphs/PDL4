FROM mcr.microsoft.com/playwright:v1.44.0-focal

WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY scrape.js ./

# Usage: docker build -t playwright-scraper .
# docker run --rm -e TARGET_URL="https://example.com/property/123" playwright-scraper

ENTRYPOINT ["node", "scrape.js"]
