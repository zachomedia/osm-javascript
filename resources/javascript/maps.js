/*
Copyright (c) 2014 Zachary Seguin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var $ = jQuery;

var Street = function() {
   return {
      name: undefined,
      type: undefined,
      lanes: 0,
      oneway: false,
      nodes: new Array()
   };
};

var Node = function() {
   return {
      latitude: 0,
      longitude: 0
   };
};

var Map = function(div) {
   this.$div = $(div);
   
   this.$data = null;
   this.streets = new Array();
   
   // Add canvas
   this.$canvas = $("<canvas id='map-canvas' width='" + this.$div.width() + "px' height='" + this.$div.height() + "px'></canvas>");
   this.$div.append(this.$canvas);
   
   return this;
};

Map.prototype.load = function(osm) {
   var _this = this;
   $.get(osm, function(data) {
      _this.$data = $(data);
      
      _this.streets = Array();
      _this.processData();
      
      var $bounds = _this.$data.find('bounds');
      _this.draw(parseFloat($bounds.attr('minlon')), parseFloat($bounds.attr('minlat')), parseFloat($bounds.attr('maxlon')), parseFloat($bounds.attr('maxlat')));
      
      $(_this).trigger('data_updated');
   });
};

Map.prototype.processData = function() {
   var _this = this;
   
   // Current Implementation: Process by "way"
   this.$data.find("way").each(function(indx, way) {
      var $way = $(way);
      
      var street = new Street();
      
      // Street details
      street.name = $way.find('tag[k=name]').attr('v');
      street.type = $way.find('tag[k=highway]').attr('v');
      street.lanes = $way.find('tag[k=lanes]').attr('v');
      street.oneway = ($way.find('tag[k=oneway]').attr('v') === 'yes');
      
      // Street "nodes"
      $way.find('nd').each(function(nindx, node) {
         var $node = $(node);
         var streetNode = new Node();
         
         var $streetNode = _this.$data.find('node[id=' + $(node).attr('ref') + ']');
         streetNode.latitude = parseFloat($streetNode.attr('lat'));
         streetNode.longitude = parseFloat($streetNode.attr('lon'));
         
         street.nodes.push(streetNode);
      });
      
      _this.streets.push(street);
   });
};

Map.prototype.draw = function(left, top, right, bottom) {
   var ctx = this.$canvas[0].getContext('2d');
   
   ctx.fillStyle = "#aa0000";
   
   var scale = 700;
   var xmult = scale / (right - left);
   var ymult = scale / (bottom - top);
   
   $.each(this.streets, function(indx, street) {
      if (street.type === undefined) { return; }
      
      ctx.beginPath();
      
      $.each(street.nodes, function(nindx, node) {
         var x = (node.longitude - left) * xmult;
         var y = (bottom - node.latitude) * ymult;
         
         if (nindx === 0) {
            ctx.moveTo(x, y);
         } else {
            ctx.lineTo(x, y);
         }
         
         console.log(x + ", " + y);
      });
      
      switch (street.type) {
      case 'residential':
         ctx.lineWidth = 2;
         ctx.strokeStyle = '#aaa';
         break;
         
      case 'tertiary':
         ctx.lineWidth = 3;
         ctx.strokeStyle = '#aaa';
         break;
         
      case 'secondary':
         ctx.lineWidth = 4;
         ctx.strokeStyle = '#aaa';
         break;
         
      default:
         ctx.lineWidth = 1;
         ctx.strokeStyle = '#ddd'
      }

      ctx.stroke();
   });
}