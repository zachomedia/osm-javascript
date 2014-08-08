<?php  

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
   
// Configure response
header('Content-Type: application/json');
$data = [];

// Load map data
// TODO: respond with only components with x-metres from requested centre point
$map_data = simplexml_load_file("summerside.osm");

//die(print_r($map_data));

// Area of information
$data['area'] = [];
$data['area']['minlat'] = (double)$map_data->bounds['minlat'];
$data['area']['minlon'] = (double)$map_data->bounds['minlon'];
$data['area']['maxlat'] = (double)$map_data->bounds['maxlat'];
$data['area']['maxlon'] = (double)$map_data->bounds['maxlon'];

// Return the ways
$nodes = [];
$data['ways'] = [];

// Process all nodes first, so they can be found easily
foreach ($map_data->node as $xnode)
{
   $nodes[(string)$xnode['id']] = $xnode;
}// End of foreach

foreach ($map_data->way as $xway)
{  
   $way = [];
   $way['nodes'] = [];
   
   // Way information
   foreach ($xway->tag as $xtag)
   {
      $way[(string)$xtag['k']] = (string)$xtag['v'];
   }// End of foreach
   
   // Way points
   foreach ($xway->nd as $xnd)
   {
      $xnode = $nodes[(string)$xnd['ref']];
      $node = [];
      
      $node['lat'] = (double)$xnode['lat'];
      $node['lon'] = (double)$xnode['lon'];
      
      $way['nodes'][] = $node;
   }// End of foreach
   
   $data['ways'][] = $way;
}// End of foreach

// Output response
echo json_encode($data);