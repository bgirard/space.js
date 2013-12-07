function deformation(options) {
  this.options = options;
  this.func = options.func;
  this.bounds = options.bounds;
  return this;
}

deformation.prototype = {

};

deformation.crater = function deformation_crater(centerX, centerY, impactSize, depth) {
  var _bounds = [centerX-impactSize*1.5, centerY-impactSize*1.5, centerX+impactSize*1.5, centerY+impactSize*1.5];
  var deform = new deformation({
    name: "Crater",
    func: function(tx, ty) {
      var v = Math.min(0,
        ((tx-centerX-impactSize)*(tx-centerX+impactSize)/(impactSize*impactSize)/2 +
         (ty-centerY-impactSize)*(ty-centerY+impactSize)/(impactSize*impactSize)/2) *
        depth);

      return v;
    },
    bounds: function() {
      return _bounds;
    },
  });
  return deform;
}
deformation.noise = function deformation_noise(period, intensity) {
  var _bounds = [0, 0, 1, 1];
  var deform = new deformation({
    name: "Crater",
    func: function(tx, ty) {
      return Math.sin((ty-Math.cos(tx))*period)*intensity;
    },
    bounds: function() {
      return _bounds;
    },
  });
  return deform;
}
