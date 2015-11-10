define(['box2d'], function(Box2D) {
   var Box2DHelper = {};

   // General utility
   var copyVec2 = Box2DHelper.copyVec2 = function(vec) {
      return new b2Vec2(vec.get_x(), vec.get_y());
   };

   var scaledVec2 = Box2DHelper.scaledVec2 = function(vec, scale) {
      return new b2Vec2(scale * vec.get_x(), scale * vec.get_y());
   };

   // Drawing utility
   var setBox2DColor = Box2DHelper.setColor = function(context, color) {            
      var color = Box2D.wrapPointer(color, b2Color);
      var red   = (color.get_r() * 255) | 0;
      var green = (color.get_g() * 255) | 0;
      var blue  = (color.get_b() * 255) | 0;
      var colStr = red + "," + green + "," + blue;
      context.fillStyle  = "rgba(" + colStr + ", 0.5)";
      context.strokeStyle = "rgb(" + colStr + ")";
   };

   var drawAxes = Box2DHelper.drawAxes = function(context, length) {
      context.strokeStyle = 'rgb(192, 0, 0)';
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(length || 1, 0);
      context.stroke();
      context.strokeStyle = 'rgb(0, 192, 0)';
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(0, length || 1);
      context.stroke();
   };

   // Debug drawing
   var drawSegment = Box2DHelper.drawSegment = function(context, vert1, vert2) {
      var vert1V = Box2D.wrapPointer(vert1, b2Vec2);
      var vert2V = Box2D.wrapPointer(vert2, b2Vec2);

      context.beginPath();
      context.moveTo(vert1V.get_x(),vert1V.get_y());
      context.lineTo(vert2V.get_x(),vert2V.get_y());
      context.stroke();
   };

   var drawPolygon = Box2DHelper.drawPolygon = function(context, vertices, vertexCount, fill) {
      var tmpI;

      context.beginPath();
      for(tmpI = 0; tmpI < vertexCount; tmpI ++) {
         var vert = Box2D.wrapPointer(vertices + (tmpI * 8), b2Vec2);
         if (tmpI === 0) {
            context.moveTo(vert.get_x(), vert.get_y());
         }
         else {
            context.lineTo(vert.get_x(), vert.get_y());
         }
      }
      context.closePath();
      if (fill) {
         context.fill();
      }
      context.stroke();
   };

   var drawCircle = Box2DHelper.drawCircle = function(context, center, radius, axis, fill) {                    
      var centerV = Box2D.wrapPointer(center, b2Vec2);
      var axisV = Box2D.wrapPointer(axis, b2Vec2);

      context.beginPath();
      context.arc(centerV.get_x(), centerV.get_y(), radius, 0, 2 * Math.PI, false);
      if (fill) {
         context.fill();
      }
      context.stroke();

      if (fill) {
         //render axis marker
         var vert2V = copyVec2(centerV);
         vert2V.op_add(scaledVec2(axisV, radius));

         context.beginPath();
         context.moveTo(centerV.get_x(), centerV.get_y());
         context.lineTo(vert2V.get_x(), vert2V.get_y());
         context.stroke();
      }
   };

   var drawTransform = Box2DHelper.drawTransform = function(context, transform) {
      var trans = Box2D.wrapPointer(transform, b2Transform);
      var pos = trans.get_p();
      var rot = trans.get_q();

      context.save();
      context.translate(pos.get_x(), pos.get_y());
      context.scale(0.5, 0.5);
      context.rotate(rot.GetAngle());
      context.lineWidth *= 2;
      drawAxes(context);
      context.restore();
   };

   // Create a typical debug draw function
   Box2DHelper.e_shapeBit = 0x0001;
   Box2DHelper.e_jointBit = 0x0002;
   Box2DHelper.e_aabbBit = 0x0004;
   Box2DHelper.e_pairBit = 0x0008;
   Box2DHelper.e_centerOfMassBit = 0x0010;

   var SetDebugDrawFunctions = Box2DHelper.SetDebugDrawFunctions = function(debugDraw, context) {
      debugDraw.DrawSegment = function(vert1, vert2, color) {                    
         setBox2DColor(context, color);                    
         drawSegment  (context, vert1, vert2);
      };

      debugDraw.DrawPolygon = function(vertices, vertexCount, color) {                    
         setBox2DColor(context, color);
         drawPolygon  (context, vertices, vertexCount, false);                    
      };

      debugDraw.DrawSolidPolygon = function(vertices, vertexCount, color) {    
         setBox2DColor(context, color);
         drawPolygon  (context, vertices, vertexCount, true);                    
      };

      debugDraw.DrawCircle = function(center, radius, color) {                    
         setBox2DColor(context, color);
         drawCircle   (context, center, radius, b2Vec2(0, 0), false);
      };

      debugDraw.DrawSolidCircle = function(center, radius, axis, color) {                    
         setBox2DColor(context, color);
         drawCircle   (context, center, radius, axis, true);
      };

      debugDraw.DrawTransform = function(transform) {
         drawTransform(context, transform);
      };
   };

   Box2DHelper.createDebugDraw = function(flags, context) {
      var debugDraw = new Box2D.JSDraw();
      Box2DHelper.SetDebugDrawFunctions(debugDraw, context);

      // Empty implementations for unused methods.
      debugDraw.SetFlags(flags);

      return debugDraw;
   };

   // Shortcuts for creating bodies
   Box2DHelper.createBody = function(world, bodyDef, fixtureDef) {
      var body = bodyDef;
      var fixture = fixtureDef;

      if (!body.ptr) {
         body = new b2BodyDef();
         for (var property in bodyDef) {
            if (!body['set_' + property]) {
               console.error('b2BodyDef.set_' + property + ' does not exist');
            }

            body['set_' + property](bodyDef[property]);
         }
      }
      
      if (!fixture.ptr) {
         fixture = new b2FixtureDef();
         for (var property in fixtureDef) {
            if (!fixture['set_' + property]) {
               console.error('b2BodyDef.set_' + property + ' does not exist');
            }

            fixture['set_' + property](fixtureDef[property]);
         }

         // Create shape
         if (fixtureDef.shape.type) {
            var shape;
            var constructionMethod = 'Set';
            if (fixtureDef.shape.type === 'edge') {
               shape = new b2EdgeShape();
            }
            else if (fixtureDef.shape.type === 'circle') {
               shape = new b2CircleShape();
               constructionMethod = 'set_m_radius';
            }
            else if (fixtureDef.shape.type === 'box') {
               shape = new b2PolygonShape();
               constructionMethod = 'SetAsBox';
            }
            else {
               console.error('Shape type', fixtureDef.shape.type, 'not implemented yet');
            }
            shape[constructionMethod].apply(shape, fixtureDef.shape.args);
            fixture.set_shape(shape);
         }
      }

      var newBody = world.CreateBody(body);
      newBody.CreateFixture(fixture);

      return newBody;
   };

   // Helper for polygon shapes
   Box2DHelper.createPolygonShape = function(vertices) {
      var shape = new b2PolygonShape();            
      var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
      var offset = 0;
      for (var i = 0; i < vertices.length; i ++) {
         Box2D.setValue(buffer+ (offset),     vertices[i].get_x(), 'float'); // x
         Box2D.setValue(buffer+ (offset + 4), vertices[i].get_y(), 'float'); // y
         offset += 8;
      }            
      var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
      shape.Set(ptr_wrapped, vertices.length);
      return shape;
   }

   return Box2DHelper;
});