# SONARICK 2.0 — Apple Health import

## Current prototype

The web app accepts a JSON file through the **Синхр.** tab. Parsing and storage happen locally in the browser using localStorage. The file is not uploaded to GitHub.

## Supported JSON format

```json
{
  "source": "Apple Health / Sonarick Sync",
  "sleep": [
    {
      "startDate": "2026-11-04T23:10:00+03:00",
      "endDate": "2026-11-05T07:00:00+03:00",
      "stage": "Asleep"
    }
  ],
  "heartRate": [
    {
      "date": "2026-11-05T03:20:00+03:00",
      "value": 58
    }
  ],
  "respiratoryRate": [
    {
      "date": "2026-11-05T03:20:00+03:00",
      "value": 14.2
    }
  ]
}
```

Sleep records need valid start and end timestamps. Heart-rate and respiratory-rate records need a timestamp and numeric value. The app also accepts basic Apple Health-style records in a `records`, `samples`, or `data` array when the record has a recognizable type/name and dates.

## iPhone workflow

1. Open the Health app and verify that Sleep, Heart Rate, and Respiratory Rate contain records from Apple Watch.
2. Build an iOS Shortcut named **Sonarick Sync** that reads the relevant Health samples and constructs the JSON shape above.
3. Save the JSON file in Files.
4. Open the installed SONARICK PWA, go to **Синхр.**, choose the JSON file, and import it.

## Important limitations

- A PWA in Safari cannot directly access HealthKit. The iOS Shortcut is the bridge.
- A normal website cannot silently read Apple Health or run background HealthKit queries.
- The current import flow is manual file selection. A truly automatic background sync requires a native iOS app/extension or a supported secure bridge.
- The score shown by the prototype is a simple sleep-duration indicator, not a medical measurement or diagnosis.
