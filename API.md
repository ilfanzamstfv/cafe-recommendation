# Backend API Preview

Base URL saat development:

```text
http://localhost:3000
```

Jika `GOOGLE_PLACES_API_KEY` belum diisi, API otomatis memakai mock data.

## Health

```http
GET /api/health
```

Example response:

```json
{
  "ok": true,
  "data": {
    "service": "cafe-recommendation-api",
    "status": "healthy",
    "mode": "mock",
    "timestamp": "2026-09-28T03:00:00.000Z"
  }
}
```

## Nearby Places

```http
GET /api/places/nearby?latitude=-6.2249&longitude=106.8093&radius=5000
```

Example response:

```json
{
  "ok": true,
  "data": {
    "source": "mock",
    "radiusMeters": 5000,
    "cafes": [
      {
        "placeId": "mock-kopi-kenangan-scbd",
        "name": "Kopi Kenangan SCBD",
        "rating": 4.2,
        "userRatingCount": 420,
        "priceLevel": "BUDGET",
        "isOpenNow": true,
        "distanceKm": 0
      }
    ]
  }
}
```

## Place Detail

```http
GET /api/places/mock-kopikalyan-cikajang?latitude=-6.2249&longitude=106.8093
```

## Recommendations

```http
GET /api/recommendations?latitude=-6.2249&longitude=106.8093&radius=5000
```

Example response:

```json
{
  "ok": true,
  "data": {
    "source": "mock",
    "userId": "demo-user",
    "preference": {
      "maxDistanceKm": 5,
      "minimumRating": 4.2,
      "preferredPrice": "MEDIUM",
      "purposes": ["WORK", "HANGOUT"]
    },
    "cafes": [
      {
        "placeId": "mock-kopikalyan-cikajang",
        "name": "Kopikalyan Cikajang",
        "recommendationScore": 91,
        "scoreBreakdown": {
          "rating": 92,
          "distance": 100,
          "preference": 100,
          "popularity": 100,
          "price": 100,
          "openStatus": 100
        },
        "reasons": [
          "1.5 km from you",
          "Rating 4.6",
          "Matches your preferred price",
          "Open now",
          "Aligned with work, hangout preference"
        ]
      }
    ]
  }
}
```

## Preferences

```http
GET /api/preferences
```

```http
PUT /api/preferences
Content-Type: application/json

{
  "maxDistanceKm": 5,
  "minimumRating": 4.3,
  "preferredPrice": "MEDIUM",
  "purposes": ["WORK", "STUDY"]
}
```

## Interactions

```http
POST /api/interactions
Content-Type: application/json

{
  "placeId": "mock-kopikalyan-cikajang",
  "interactionType": "LIKE"
}
```

Supported `interactionType`:

```text
LIKE
SAVE
VISITED
NOT_INTERESTED
```

## Favorites

```http
GET /api/favorites
```

```http
POST /api/favorites
Content-Type: application/json

{
  "placeId": "mock-kopikalyan-cikajang"
}
```

```http
DELETE /api/favorites?placeId=mock-kopikalyan-cikajang
```
