function deformation(options) {
  this.options = options;
  this.func = options.func;
  this.bounds = options.bounds;
  return this;
}

deformation.prototype = {

};

deformation.crater = function deformation_crater(centerX, centerY, impactSize, depth) {
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
      return [centerX-impactSize, centerY-impactSize, impactSize*2, impactSize*2];
    },
  });
  return deform;
}
