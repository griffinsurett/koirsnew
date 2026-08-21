# OneSignal Integration

This integration is available in the starter template and is disabled by default.

## Enable

Set these values in `.env`:

```env
PUBLIC_ONESIGNAL_APP_ID=your-onesignal-app-id
PUBLIC_ONESIGNAL_SAFARI_WEB_ID=web.onesignal.auto.your-safari-id
PUBLIC_ONESIGNAL_NOTIFY_BUTTON=true
```

If either `PUBLIC_ONESIGNAL_APP_ID` or `PUBLIC_ONESIGNAL_SAFARI_WEB_ID` is empty, OneSignal does not initialize.

## Consent Behavior

OneSignal scripts are marked with:

- `type="text/plain"`
- `data-consent="targeting"`

They activate only after the consent system enables targeting scripts.

## Worker Files

These root worker files are included in `public/`:

- `/OneSignalSDKWorker.js`
- `/OneSignalSDKUpdaterWorker.js`
