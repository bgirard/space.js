function SpaceShipView(camera, options) {

  camera.ticks = camera.ticks || [];
  camera.vel = 0.003;
  function getMaxVel() {
    return Math.min((camera.position.z-1)/50, 0.01);
  }
  camera.ticks.push(function move_ship() {
    camera.vel = Math.min(getMaxVel(), camera.vel);
    var facing = new THREE.Vector3( 0, 0, -1 );
    facing.applyQuaternion( camera.quaternion );
    facing.normalize();
    facing.multiplyScalar(camera.vel);
    camera.position.add(facing);
    console.log(camera.position.z);
  });
  window.addEventListener("keypress", function(e) {
    var chr = String.fromCharCode(e.which);
    if (chr == "w") {
      camera.vel += getMaxVel()/10;
    } else if (chr == "d") {
      camera.rotation.y -= 0.01;
    } else if (chr == "s") {
      camera.vel -= getMaxVel()/10;
    } else if (chr == "a") {
      camera.rotation.y += 0.01;
    }

  }, false);
}
