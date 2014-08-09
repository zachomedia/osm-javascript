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

var Map = function(div) {
   this.$div = $(div);
   
   this.scale = 1000;
   
   this.data = null;
   this.streets = new Array();
   
   // Add canvas
   this.$canvas = $("<canvas id='map-canvas'></canvas>");
   this.$canvas[0].width = this.$div.width();
   this.$canvas[0].height = this.$div.height();
      
   this.$div.append(this.$canvas);
   
   // Register events
   var _this = this;
   $(window).on('resize', function() {
      clearTimeout(_this.resizeTimeout);
      _this.resizeTimeout = setTimeout(function() {
         _this.draw();
      }, 500);
   });
   
   this.$canvas.on('mousewheel', function(event) {
      _this.scale = Math.max(100, _this.scale - event.originalEvent.deltaY / 2);
      _this.draw();
   });
   
   this.$canvas.on('mousedown', function(event) {
      _this.last_position = {
         x: event.clientX,
         y: event.clientY
      };
      
      $(this).bind('mousemove', function(event) {
         var delta = {
            x: _this.last_position.x - event.clientX,
            y: _this.last_position.y - event.clientY
         };
         
         _this.data.area.minlat -= delta.y / (10 * _this.scale);
         _this.data.area.maxlat -= delta.y / (10 * _this.scale);
         
         _this.data.area.minlon += delta.x / (10 * _this.scale);
         _this.data.area.maxlon += delta.x / (10 * _this.scale);
         
         _this.last_position = {
            x: event.clientX,
            y: event.clientY
         };
         
         _this.draw();
      });
   });
   
   this.$canvas.on('mouseup', function(event) {
      $(this).unbind('mousemove');
   })
   
   return this;
};

Map.prototype.load = function(osm) {
   var _this = this;
   $.getJSON(osm, function(data) {
      _this.data = data;
      _this.draw();
      
      $(_this).trigger('data_updated');
   });
};

Map.prototype.draw = function() {
   var _this = this;
   var display = ['residential', 'tertiary', 'secondary', 'motorway', 'motorway_link', 'service'];

   var ctx = this.$canvas[0].getContext('2d');
   
   this.$canvas[0].width = this.$div.width();
   this.$canvas[0].height = this.$div.height();
   ctx.width = this.$div.width();
   ctx.height = this.$div.height();
   
   var xmult = this.scale / (this.data.area.maxlon - this.data.area.minlon);
   var ymult = this.scale / (this.data.area.maxlat - this.data.area.minlat);
   
   $.each(this.data.ways, function(indx, way) {   
      if (way.highway === undefined) return;
      if ($.inArray(way.highway, display) === -1) return;
            
      ctx.beginPath();
      
      var hasInRange = false;
      $.each(way.nodes, function(nindx, node) {
         var x = (node.lon - _this.data.area.minlon) * xmult;
         var y = (_this.data.area.maxlat - node.lat) * ymult;
                          
         if (nindx === 0) {
            ctx.moveTo(x, y);
         } else {
            ctx.lineTo(x, y);
         }
                  
         if (node.lon > Math.min(_this.data.area.minlon, _this.data.area.maxlon) && node.lon < Math.max(_this.data.area.minlon, _this.data.area.maxlon)) { hasInRange = true };
         if (node.lat > Math.min(_this.data.area.minlat, _this.data.area.maxlat) && node.lat < Math.max(_this.data.area.minlat, _this.data.area.maxlat)) { hasInRange = true };
      });
      
      if (!hasInRange) { return; };
      
      ctx.lineWidth = 1;
      var primaryColour = '#ddd';
      var secondaryColour = 'transparent';
      
      switch(way.highway) {
         case 'residential':
            ctx.lineWidth = 2;
            primaryColour = '#eee';
            secondaryColour = '#ccc';
            
            break;
      
         case 'tertiary':
            ctx.lineWidth = 3;
            primaryColour = '#77d3f6';
            secondaryColour = '#085977';
            
            break;
      
         case 'secondary':
            ctx.lineWidth = 4;
            primaryColour = '#56a0c1';
            secondaryColour = '#265469';
                        
            break;
      
         case 'motorway':
         case 'motorway_link':
            ctx.lineWidth = 5;
            primaryColour = '#029887';
            secondaryColour = '#01554b';
            
            break;
      }
      
      ctx.lineWidth += 2;
      ctx.strokeStyle = secondaryColour;
      ctx.stroke();
      
      ctx.lineWidth -= 2;
      ctx.strokeStyle = primaryColour;
      ctx.stroke();
      
   });   
}