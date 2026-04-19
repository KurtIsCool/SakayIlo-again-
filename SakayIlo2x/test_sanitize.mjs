function sanitizeName(filename) {
  let name = filename.replace(/\.geojson$/i, '');
  // Remove "route_<number>_" prefix
  name = name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '');
  // Replace underscores with spaces
  name = name.replace(/_/g, ' ');
  // Capitalize properly (this regex only upper cases the first letter of a word if it follows a word boundary)
  // But actually the original regex was `\b\w` which is word boundary character.
  // Wait, let's see.
  // Wait, the user wants "La Paz - City Proper"
  // Is it possible the filename doesn't have a dash? "route_11_la_paz_iloilo_city_proper_via_isatu2.geojson" -> "La Paz Iloilo City Proper Via Isatu2"

  // Actually, wait, user wants: "update sanitizeName to strip underscores and file extensions so the UI shows "La Paz - City Proper" instead of "route_11_la_paz...""
  // Actually, wait, the example in the prompt is "La Paz - City Proper".
  // Let's look at the filenames. "route_11_la_paz_iloilo_city_proper_via_isatu2.geojson"
  // If it's a direct replace, maybe "La Paz Iloilo City Proper Via Isatu2" is fine. The user said: "strip underscores and file extensions so the UI shows 'La Paz - City Proper' instead of 'route_11_la_paz...'" Wait, is "route_11_la_paz..." literally what it showed before?

  name = name.replace(/\b\w/g, char => char.toUpperCase());
  return name.trim();
}

console.log(sanitizeName("route_11_la_paz_iloilo_city_proper_via_isatu2.geojson"));
