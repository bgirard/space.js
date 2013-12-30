var TEXTURE_SIZE = 512;
var PIXELS_PER_TILE = 16;

function Planetoid(deformations) {
  this._fractalMesh = new FractalMesh(null, deformations, {
    getTexturePixel: function(tx, ty, deformations, pixels, pos) {
      pixels[pos + 0] = 140;
      pixels[pos + 1] = 140;
      pixels[pos + 2] = 140;
    },
  });
  return this;
};

Planetoid.prototype.add = function(scene) {
  this._fractalMesh.add(scene);
};

Planetoid.prototype.remove = function(scene) {
  this._fractalMesh.remove(scene);
};
