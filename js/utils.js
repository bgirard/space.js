function createElement(name, props) {
  var el = document.createElement(name);

  for (var key in props) {
    if (key === "style") {
      for (var styleName in props.style) {
        el.style[styleName] = props.style[styleName];
      }   
    } else if (key === "parent") {
      props[key].appendChild(el);
    } else {
      el[key] = props[key];
    }   
  }   

  return el; 
}


