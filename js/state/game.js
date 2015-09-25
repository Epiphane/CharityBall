define(['box2d'], function(Box2D) {   
   var context;

   function copyVec2(vec) {
      return new b2Vec2(vec.get_x(), vec.get_y());
   }

   function scaledVec2(vec, scale) {
      return new b2Vec2(scale * vec.get_x(), scale * vec.get_y());
   }

   function drawAxes(ctx) {
      ctx.strokeStyle = 'rgb(192,0,0)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(30, 0);
      ctx.stroke();
      ctx.strokeStyle = 'rgb(0,192,0)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 30);
      ctx.stroke();
   }

   function setColorFromDebugDrawCallback(color) {            
       var col = Box2D.wrapPointer(color, b2Color);
       var red = (col.get_r() * 255)|0;
       var green = (col.get_g() * 255)|0;
       var blue = (col.get_b() * 255)|0;
       var colStr = red+","+green+","+blue;
       context.fillStyle = "rgba("+colStr+",0.5)";
       context.strokeStyle = "rgb("+colStr+")";
   }

   function drawSegment(vert1, vert2) {
       var vert1V = Box2D.wrapPointer(vert1, b2Vec2);
       var vert2V = Box2D.wrapPointer(vert2, b2Vec2);                    
       context.beginPath();
       context.moveTo(vert1V.get_x(),vert1V.get_y());
       context.lineTo(vert2V.get_x(),vert2V.get_y());
       context.stroke();
   }

   function drawPolygon(vertices, vertexCount, fill) {
       context.beginPath();
       for(tmpI=0;tmpI<vertexCount;tmpI++) {
           var vert = Box2D.wrapPointer(vertices+(tmpI*8), b2Vec2);
           if ( tmpI == 0 )
               context.moveTo(vert.get_x(),vert.get_y());
           else
               context.lineTo(vert.get_x(),vert.get_y());
       }
       context.closePath();
       if (fill)
           context.fill();
       context.stroke();
   }

   function drawCircle(center, radius, axis, fill) {                    
       var centerV = Box2D.wrapPointer(center, b2Vec2);
       var axisV = Box2D.wrapPointer(axis, b2Vec2);
       
       context.beginPath();
       context.arc(centerV.get_x(),centerV.get_y(), radius, 0, 2 * Math.PI, false);
       if (fill)
           context.fill();
       context.stroke();
       
       if (fill) {
           //render axis marker
           var vert2V = copyVec2(centerV);
           vert2V.op_add( scaledVec2(axisV, radius) );
           context.beginPath();
           context.moveTo(centerV.get_x(),centerV.get_y());
           context.lineTo(vert2V.get_x(),vert2V.get_y());
           context.stroke();
       }
   }

   function drawTransform(transform) {
       var trans = Box2D.wrapPointer(transform,b2Transform);
       var pos = trans.get_p();
       var rot = trans.get_q();
       
       context.save();
       context.translate(pos.get_x(), pos.get_y());
       context.scale(0.5,0.5);
       context.rotate(rot.GetAngle());
       context.lineWidth *= 2;
       drawAxes(context);
       context.restore();
   }

   function SetDebugDrawFunctions(debugDraw) {
      debugDraw.DrawSegment = function(vert1, vert2, color) {                    
         setColorFromDebugDrawCallback(color);                    
         drawSegment(vert1, vert2);
      };

      debugDraw.DrawPolygon = function(vertices, vertexCount, color) {                    
         setColorFromDebugDrawCallback(color);
         drawPolygon(vertices, vertexCount, false);                    
      };

      debugDraw.DrawSolidPolygon = function(vertices, vertexCount, color) {    
         setColorFromDebugDrawCallback(color);
         drawPolygon(vertices, vertexCount, true);                    
      };

      debugDraw.DrawCircle = function(center, radius, color) {                    
         setColorFromDebugDrawCallback(color);
         var dummyAxis = b2Vec2(0,0);
         drawCircle(center, radius, dummyAxis, false);
      };

      debugDraw.DrawSolidCircle = function(center, radius, axis, color) {                    
         setColorFromDebugDrawCallback(color);
         drawCircle(center, radius, axis, true);
      };

      debugDraw.DrawTransform = function(transform) {
         drawTransform(transform);
      };
   }


   function setColorFromDebugDrawCallback( colorPtr ) {
      var color = Box2D.wrapPointer( colorPtr, b2Color );
      var red = (color.get_r() * 255) | 0;
      var green = (color.get_g() * 255) | 0;
      var blue = (color.get_b() * 255) | 0;

      var colorStr = red + "," + green + "," + blue;
      context.fillStyle = "rgba(" + colorStr + ",0.5)";
      context.strokeStyle = "rgb(" + colorStr + ")";
   }

   function drawSegment( vert1Ptr, vert2Ptr ) {
      var vert1 = Box2D.wrapPointer( vert1Ptr, b2Vec2 );
      var vert2 = Box2D.wrapPointer( vert2Ptr, b2Vec2 );

      context.beginPath();
      context.moveTo( vert1.get_x(), vert1.get_y() );
      context.lineTo( vert2.get_x(), vert2.get_y() );
      context.stroke();
   }

   var CONTAINER_MIDDLE = 1;
   var CONTAINER_LEFT = 0;
   var CONTAINER_RIGHT = 2;
   var contained = [-2, -2, -2];

   function registerContactChange(contacting, sensor, body) {
      var containerType = sensor.GetUserData();

      if (contacting) contained[containerType] ++;
      else contained[containerType] --;

      console.log(containerType, contained[containerType]);
   }

   return Juicy.State.extend({
      constructor: function() {
         this.world = new Box2D.b2World(new Box2D.b2Vec2(0.0, -10.0));

         listener = new JSContactListener();
         listener.BeginContact = function (contactPtr) {
            var contact = Box2D.wrapPointer( contactPtr, b2Contact );
            var fixtureA = contact.GetFixtureA();
            var fixtureB = contact.GetFixtureB();

            if (fixtureA.IsSensor()) {
               registerContactChange(true, fixtureA, fixtureB);
            }

            if (fixtureB.IsSensor()) {
               registerContactChange(true, fixtureB, fixtureA);
            }
         }

         // Empty implementations for unused methods.
         listener.EndContact = function (contactPtr) {
            var contact = Box2D.wrapPointer( contactPtr, b2Contact );
            var fixtureA = contact.GetFixtureA();
            var fixtureB = contact.GetFixtureB();

            if (fixtureA.IsSensor()) {
               registerContactChange(false, fixtureA, fixtureB);
            }
            
            if (fixtureB.IsSensor()) {
               registerContactChange(false, fixtureB, fixtureA);
            }
         }
         listener.PreSolve = function() {};
         listener.PostSolve = function() {};

         this.world.SetContactListener( listener );

         var debugDraw = new Box2D.JSDraw();
         SetDebugDrawFunctions(debugDraw);

         // Empty implementations for unused methods.
         debugDraw.SetFlags(3);

         this.world.SetDebugDraw( debugDraw );
      
         var bd = new b2BodyDef();
         // bd.set_position(new b2Vec2(0, -2));
         bd.set_type(Box2D.b2_kinematicBody);
         // bd.set_linearVelocity(new b2Vec2(8, 0));
         this.groundBody = bd;

         var groundBody = this.groundBody = this.world.CreateBody(bd);
         var shape = new b2EdgeShape();
         shape.Set(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
         groundBody.CreateFixture(shape, 0.0);

         {
            bd = new b2BodyDef();
            bd.set_position(new b2Vec2(0, 1.0));
            bd.set_type(Box2D.b2_kinematicBody);

            this.playerBody = this.world.CreateBody(bd);
            var shape = new b2CircleShape();
            shape.set_m_radius(1.0);
            this.playerBody.CreateFixture(shape, 0.0);
         }

         var a = 0.25;
         shape = new b2PolygonShape();
         shape.SetAsBox(a, a);
         var fix = new b2FixtureDef();
         fix.set_density(0.2);
         fix.set_friction(10);
         fix.set_shape(shape);
         this.shape = fix;

         var x = new b2Vec2(-2.2, 5.25);
         var y = new b2Vec2();
         var deltaX = new b2Vec2(0.5625, 1.25);
         var deltaY = new b2Vec2(1.125, 0.0);

         bd = new b2BodyDef();
         bd.set_type( Box2D.b2_dynamicBody );

         var jointDef = null;

         for (var i = 0; i < 5; ++i) {
            y = copyVec2(x);

            for (var j = i; j < 5; ++j) {
               bd.set_position(y);                        
               var body = this.world.CreateBody(bd);
               body.CreateFixture(this.shape);
               y.op_add(deltaY);
            }

            x.op_add(deltaX);
         }


         var jd = new b2RevoluteJointDef();

         {
            var shape = new b2PolygonShape();
            shape.SetAsBox(10.0, 0.125);

            var bd = new b2BodyDef();
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new b2Vec2(0.0, 2.3));
            // bd.set_angle(-0.15);

            this.seesawBody = this.world.CreateBody(bd);
            this.seesawBody.CreateFixture(shape, 200.0);





            // Water detection area?
            shape = new b2PolygonShape();
            shape.SetAsBox(4, 4, new b2Vec2(0, 4), 0);

            bd = new b2BodyDef();
            bd.set_type(Box2D.b2_kinematicBody);
            bd.set_position(new b2Vec2(0.0, 4.3));

            var fd = new b2FixtureDef();
            fd.set_density(0);
            fd.set_isSensor(true);
            fd.set_shape(shape);
            fd.set_userData(CONTAINER_MIDDLE);

            this.seesawBody.CreateFixture(fd);

            shape.SetAsBox(3, 4, new b2Vec2(7, 4), 0);
            fd.set_userData(CONTAINER_RIGHT);
            this.seesawBody.CreateFixture(fd);

            shape.SetAsBox(3, 4, new b2Vec2(-7, 4), 0);
            fd.set_userData(CONTAINER_LEFT);
            this.seesawBody.CreateFixture(fd);
            // End












            var dw = 0.1;
            var anchor = new b2Vec2(-dw, 1);
            jd.Initialize(this.playerBody, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);

            anchor = new b2Vec2(dw, 1);
            jd.Initialize(this.playerBody, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);

            shape = new b2PolygonShape();
            shape.SetAsBox(0.2, 1.0);

            bd = new b2BodyDef();
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new b2Vec2(-4.0, 3));

            var leftHook = this.leftHook = this.world.CreateBody(bd);
            leftHook.CreateFixture(shape, 30);
         
            jd = new b2WeldJointDef();

            anchor = new b2Vec2(0.0, 2.2);
            jd.Initialize(leftHook, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);

            bd = new b2BodyDef();
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new b2Vec2(4.0, 3));

            var rightHook = this.rightHook = this.world.CreateBody(bd);
            rightHook.CreateFixture(shape, 30);
         
            jd.Initialize(rightHook, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);







            bd = new b2BodyDef();
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new b2Vec2(-10.0, 3));

            var rightHook = this.rightHook = this.world.CreateBody(bd);
            rightHook.CreateFixture(shape, 30);
         
            jd.Initialize(rightHook, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);

            bd = new b2BodyDef();
            bd.set_type(Box2D.b2_dynamicBody);
            bd.set_position(new b2Vec2(10.0, 3));

            var rightHook = this.rightHook = this.world.CreateBody(bd);
            rightHook.CreateFixture(shape, 30);
         
            jd.Initialize(rightHook, this.seesawBody, anchor);
            jd.set_collideConnected(true);
            this.world.CreateJoint(jd);
         }

         this.speed = 0;

         this.counter = 0;
      },
      init: function() {
      },
      key_ESC: function() {
         this.paused = !this.paused;
      },
      update: function(dt, game) {
         if (this.paused) {
            return true;
         }

         this.counter -= dt;
         if (this.counter <= 0) {
            this.counter = 0.5;

            bd = new b2BodyDef();
            bd.set_type( Box2D.b2_dynamicBody );

            bd.set_position(new b2Vec2(Math.random() * 40 - 20, 30));                        
            var body = this.world.CreateBody(bd);
            body.CreateFixture(this.shape);
         }

         this.speed *= 0.9;

         var leftOrRight = 0;
         if (game.keyDown('LEFT')) {
            this.leftHook.GetFixtureList().SetDensity(70);
            this.speed -= 1;
         }
         else {
            this.leftHook.GetFixtureList().SetDensity(40);
         }
         if (game.keyDown('RIGHT')) {
            this.speed += 1;
            this.rightHook.GetFixtureList().SetDensity(70);
         }
         else {
            this.rightHook.GetFixtureList().SetDensity(40);
         }

         // this.leftHook.ResetMassData();
         // this.rightHook.ResetMassData();

         this.playerBody.SetLinearVelocity(new b2Vec2(this.speed, 0));

         // Using 1/60 instead of dt because fixed-time calculations are more accurate
         this.world.Step(1/60, 3, 2);
      },
      render: function(c) {
         context = c;

         c.lineWidth = 0.1;

         c.save();
         c.translate(30, 34);
         c.scale(1, -1);

         drawAxes(c);

         this.world.DrawDebugData();
         c.restore();
      }
   });
})