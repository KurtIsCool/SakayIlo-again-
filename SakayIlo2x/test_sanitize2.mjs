function sanitizeName(filename) {
  let name = filename.replace(/\.geojson$/i, '');
  // Before: name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '')
  // Actually, wait, the user's prompt says: "update sanitizeName to strip underscores and file extensions so the UI shows 'La Paz - City Proper' instead of 'route_11_la_paz...'"
  // Is it just a matter of changing how `route_11_la_paz...` was shown? In the codebase, it actually says `route_11_la_paz_iloilo_city_proper...`. Wait, maybe `route_` was not completely removed?
  // Let me check if `sanitizeName` is currently doing what the user complains about, or if `sanitizeName` *needs* to be updated to match the prompt exactly.

  // What if I change it to `name = name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '');` then `name = name.replace(/_to_|_/g, ' - ');`? Or just `name = name.replace(/_/g, ' ');`?
  // User says: "strip underscores and file extensions so the UI shows "La Paz - City Proper" instead of "route_11_la_paz..."."
  // Wait, the current `sanitizeName` DOES strip underscores. Let's see how it currently works on `route_11_la_paz...`

  // Wait, maybe the current implementation doesn't actually remove `route_11_` if there is no `_`? No, it does.
  // BUT the user says: "update sanitizeName to strip underscores and file extensions so the UI shows "La Paz - City Proper" instead of "route_11_la_paz..."."

  // Wait, is there a `route_name` property in `sanitizeName` that is different in `app.js` and `routingEngine.ts`?
  // Oh, `dataLoader.js` is what they told me to update!
  // Wait, wait... "Data Sanitization: In dataLoader.js, update sanitizeName to strip underscores and file extensions so the UI shows "La Paz - City Proper" instead of "route_11_la_paz...""
  // Maybe I should just modify `sanitizeName` to remove `route_` completely and replace underscores with spaces?
  // It ALREADY replaces underscores with spaces! Let's check `dataLoader.js` again. Wait, I ran `node test_sanitize.mjs` and it output `La Paz Iloilo City Proper Via Isatu2`.
  // Wait! The user says `La Paz - City Proper` instead of `route_11_la_paz...`.
  // Let's replace `_iloilo_city_proper` with ` - City Proper`? Or maybe just replace `_` with ` ` is what they want, and they used `La Paz - City Proper` as an example? "strip underscores and file extensions so the UI shows "La Paz - City Proper" instead of "route_11_la_paz..."".
  // Let me look at the `routeFiles` in `dataLoader.js`.

}
