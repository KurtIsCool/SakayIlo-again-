function sanitizeName(filename) {
  let name = filename.replace(/\.geojson$/i, '');
  name = name.replace(/^route_([0-9]+[a-zA-Z]?)_/i, '');

  // They want "La Paz - City Proper". So we replace something with " - "
  // Often it's "_iloilo_city_proper" or "_to_city_proper"
  // Let's just replace all instances of "_iloilo_city_proper" with " - City Proper"
  // Also "_to_" could be " - " ?

  name = name.replace(/_iloilo_city_proper/i, ' - City Proper');
  name = name.replace(/_to_city_proper/i, ' - City Proper');

  name = name.replace(/_/g, ' ');
  name = name.replace(/\b\w/g, char => char.toUpperCase());

  // " - City Proper" will become " - City Proper". Wait, `\b\w` will uppercase it anyway.
  return name.trim();
}

const files = [
  "route_11_la_paz_iloilo_city_proper_via_isatu2.geojson",
  "route_15a_liko_molo_iloilo_city_proper_via_baluarte_loop_jeepney_route2.geojson",
  "route_15b_derecho_molo_iloilo_city_proper_via_baluarte_loop_jeepney_route2.geojson",
  "route_1_bo._obrero_lapuz_to_city_proper_loop.geojson",
  "route_2_calaparan_calumpang_iloilo_city_proper2.geojson",
  "route_3_ungka_iloilo_city_proper_via_cpu2.geojson",
  "route_4_ungka_iloilo_city_via_diversion_festive_walk_transport_hub_loop2.geojson",
  "route_5_festive_walk_transport_hub_iloilo_city_proper_via_sm_city2.geojson",
  "route_7_compania_iloilo_city_proper_loop2.geojson",
  "route_9_mohon_infante_loop2.geojson"
];

for (const f of files) {
    console.log(f, "  =>  ", sanitizeName(f));
}
