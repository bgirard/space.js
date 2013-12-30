function createStarfield() {
  var geometry  = new THREE.SphereGeometry(90, 32, 32);
  var material  = new THREE.MeshBasicMaterial();
  material.map   = THREE.ImageUtils.loadTexture("images/misc/galaxy_starfield.png");
  material.side  = THREE.BackSide;
  var stars  = new THREE.Mesh(geometry, material);
  stars.name = "Starfield";
  return stars;
}

