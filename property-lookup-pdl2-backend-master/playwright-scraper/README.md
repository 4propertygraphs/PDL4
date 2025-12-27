# Playwright scraper (Docker)

Small helper container to scrape live property data (price/status/address) for AI delta comparison.

## Build
```
cd playwright-scraper
docker build -t playwright-scraper .
```

## Run
```
docker run --rm \
  -e TARGET_URL="https://example.com/property/123" \
  -e SELECTORS='{"price":".price",".status":".status",".address":".address"}' \
  playwright-scraper
```

Output is JSON on stdout, e.g.:
```
{"url":"...","scrapedAt":"...","data":{"price":"€123,000","status":"For Sale","address":"Dublin"}}
```

You can tweak selectors via `SELECTORS` env. Integrate this container from the backend (e.g., run `docker run` or call it via sidecar/queue) and merge the scraped data with your stored property to produce the delta.***
