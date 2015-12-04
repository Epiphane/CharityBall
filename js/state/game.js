define([
   'box2d',
   'helper/box2dHelper',
   'state/score',
   'component/waterspawner',
   'component/sprite'
], function(
   Box2D,
   Box2DHelper,
   ScoreState,
   WaterSpawner,
   Sprite
) {
   var CONTAINER_MIDDLE = 1;
   var CONTAINER_LEFT = 0;
   var CONTAINER_RIGHT = 2;
   var contained = [0, 0, 0];

   var waterImg = new Image();
   waterImg.src = '/assets/water.png';

   var jerrycanImg = new Image();
   jerrycanImg.src = '/assets/jerrycan.png';

   var waterUIImg = new Image();
   waterUIImg.src = '/assets/waterui.png';

   var waterUIFullImg = new Image();
   waterUIFullImg.src = '/assets/waterui_full.png';

   function registerContactChange(contacting, sensor, body) {
      var containerType = sensor.GetUserData();

      if (contacting) contained[containerType] ++;
      else contained[containerType] --;

      body = body.GetBody();
      body.SetUserData(1);
   }

   return Juicy.State.extend({
      constructor: function() {
         this.world = new Box2D.b2World(new Box2D.b2Vec2(0.0, 10.0));

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
         // Empty implementations for unused methods.
         listener.PreSolve = function() {};
         listener.PostSolve = function() {};

         this.world.SetContactListener(listener);

         this.rainBodies = [];
         this.rainTransitions = [];

         this.createScene();

         this.player = new Juicy.Entity(this, ['Sprite']);
         this.player.getComponent('Sprite').setSheet('assets/player.png', 8, 12);
         this.player.width = 4/3;
         this.player.height = 2;

         this.plate = new Image();
         this.plate.src = 'assets/plate.png';

         this.groundImg = new Image();
         this.groundImg.src = 'assets/ground.png';

         this.scoreText = new Juicy.Entity(this, ['Text']);
         this.scoreText.getComponent('Text').set({
            font: '50px Arcade Classic',
            text: '0'
         });

         this.score = 0;
         this.water = 0;
         this.capacity = 85;
         this.combo = 0;
         this.comboTime = 1;
         this.comboTimer = 0;

         var waterfallSpawner = new WaterSpawner();
         waterfallSpawner.setRainPerSec(25);
         waterfallSpawner.width = 2;
         waterfallSpawner.onspawn = this.createRain.bind(this);

         var river = new Juicy.Entity(this, [waterfallSpawner]);
         river.position.y = -10;
         river.position.x = -27;

         this.waterSpawners = [river];

         this.countdown = new Juicy.Entity(this, ['Text']);
         this.countdown.getComponent('Text').set({
            font: '28px Arcade Classic',
            text: 'Time Remaining: 30'
         });
         this.countdown.time = this.countdown.max = 45;

         this.announcement = new Juicy.Entity(this, ['Box', 'Text']);
         this.announcement.getComponent('Text').set({
            font: '52px Arcade Classic',
            text: 'Rain!'
         });

         var box = this.announcement.getComponent('Box')
         box.fillStyle = '#b28a75';
         box.strokeStyle = '#000';
         box.lineWidth = 10;
         box.padding = [30, 20, 30, -5];
      },
      createScene: function() {
         // Create ground
         Box2DHelper.createBody(this.world, {
            type: Box2D.b2_kinematicBody
         }, {
            density: 0.0,
            shape: {
               type: 'edge',
               args: [new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0)]
            }
         });

         // Create player body
         this.playerBody = Box2DHelper.createBody(this.world, {
            type: Box2D.b2_kinematicBody,
            position: new b2Vec2(0.0, -1.0)
         }, {
            density: 0.0,
            shape: {
               type: 'circle',
               args: [1.0]
            }
         });

         // Create seesaw on the player
         this.createSeesaw();

         // Create shape for all the rain
         var a = 0.25;
         var rainShape = Box2DHelper.createPolygonShape([new b2Vec2(0.0, -1.0), new b2Vec2(-0.5, 0.0), new b2Vec2(0.5, 0.0)]);

         this.rainFixture = new b2FixtureDef();
         this.rainFixture.set_density(120.0);
         this.rainFixture.set_friction(10);
         this.rainFixture.set_shape(rainShape);

         // Rain body definition
         this.rainBody = new b2BodyDef();
         this.rainBody.set_type(Box2D.b2_dynamicBody);

         // Create initial rain
         var x = new b2Vec2(-2.2, -5.25);
         var y = new b2Vec2();
         var deltaX = new b2Vec2(0.5625, -1.25);
         var deltaY = new b2Vec2(1.125, 0.0);

         for (var i = 0; i < 5; ++i) {
            y = Box2DHelper.copyVec2(x);

            for (var j = i; j < 5; ++j) {
               this.createRain(y.get_x(), y.get_y());
               y.op_add(deltaY);
            }

            x.op_add(deltaX);
         }

         // Create Jerry can
         this.jerrycan = Box2DHelper.createBody(this.world, {
            type: Box2D.b2_kinematicBody,
            position: new b2Vec2(27, -8)
         }, {
            shape: {
               type: 'box',
               args: [7.0, 8.0]
            },
            density: 0,
            isSensor: true,
            userData: CONTAINER_RIGHT
         });

         this.speed = 0;
      },
      createRain: function(x, y) {
         this.rainBody.set_position(new b2Vec2(x, y));
         var newRainBody = Box2DHelper.createBody(this.world, this.rainBody, this.rainFixture);

         this.rainBodies.push(newRainBody);
      },
      createJoint: function(Type, root, body, anchor) {
         var jd = new Type();
             jd.set_collideConnected(true);

         jd.Initialize(root, body, anchor);
         this.world.CreateJoint(jd);
      },
      createWall: function(seesawBody, xPos, angle) {
         var wall = Box2DHelper.createBody(this.world, {
            type: Box2D.b2_dynamicBody,
            position: new b2Vec2(xPos, -3.0)
         }, {
            density: 30.0,
            shape: {
               type: 'box',
               args: [0.2, 1.0]
            }
         });

         if (angle) {
            wall.SetTransform(wall.GetPosition(), angle * Math.PI / 180);
         }

         this.createJoint(b2WeldJointDef, wall, seesawBody, new b2Vec2(0.0, -2.2));

         return wall;
      },
      createSeesaw: function() {
         // Create horizontal platform
         var seesawBody = this.seesawBody = Box2DHelper.createBody(this.world, {
            type: Box2D.b2_dynamicBody,
            position: new b2Vec2(0.0, -2.3)
         }, {
            density: 200.0,
            shape: {
               type: 'box',
               args: [4.0, 0.125]
            }
         });

         // Attach seesaw to player
         var djoint = 0.15;
         this.createJoint(b2RevoluteJointDef, this.playerBody, seesawBody, new b2Vec2(-djoint, -1));
         this.createJoint(b2RevoluteJointDef, this.playerBody, seesawBody, new b2Vec2(djoint, -1));

         // Create walls
         this.createWall(seesawBody, 4.0, 30.0);
         this.createWall(seesawBody, -4.0, -30.0);
      },
      init: function() {
         var debugDraw = Box2DHelper.createDebugDraw(Box2DHelper.e_shapeBit, this.game.getContext());
         this.world.SetDebugDraw(debugDraw);
      },
      key_ESC: function() {
         this.paused = !this.paused;
      },
      filledContainer: function() {
         console.log('filled container!');
         this.countdown.time = Math.min(this.countdown.time + 30, this.countdown.max);
      },
      update: function(dt, game) {
         if (this.paused) {
            return true;
         }

         if (this.countdown.time <= 0) {
            this.game.setState(new ScoreState(this.score));
         
            return;
         }

         if (this.combo) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
               this.comboTimer = this.comboTime;
               this.combo --;
               console.log('combo', this.combo);
            }
         }

         for (var i = this.waterSpawners.length - 1; i >= 0; i--) {
            this.waterSpawners[i].update(dt);
         };

         this.announcement.update(dt);

         // Update game counter
         this.countdown.time -= dt;
         this.countdown.getComponent('Text').set({ text: 'Time Remaining: ' + this.countdown.time.toFixed(2) });

         // Update transitions
         for (var i = 0; i < this.rainTransitions.length; i ++) {
            var transition = this.rainTransitions[i];

            if (transition.time > 0.5) {
               this.rainTransitions.splice(i--, 1);

               this.score += 5 + this.combo;
               this.water ++;
               if (this.water >= this.capacity) {
                  this.water -= this.capacity;
                  this.filledContainer();
               }
               if (this.score )
               this.combo ++;
               this.comboTimer = this.comboTime;
            }

            transition.time += dt;

            transition.progress = transition.time * 2;
         }

         this.speed *= 0.9;

         var leftOrRight = 0;
         if (game.keyDown('LEFT')) {
            this.speed -= 1;
            this.player.getComponent('Sprite').flipped = true;
         }
         if (game.keyDown('RIGHT')) {
            this.speed += 1;
            this.player.getComponent('Sprite').flipped = false;
         }

         this.playerBody.SetLinearVelocity(new b2Vec2(this.speed, 0));

         // Using 1/60 instead of dt because fixed-time calculations are more accurate
         this.world.Step(1/60, 3, 2);

         for (var i = 0; i < this.rainBodies.length; i ++) {
            var rain = this.rainBodies[i];
            var data = rain.GetUserData();

            if (rain.GetPosition().get_y() > -0.5 || data === 1) {
               if (data === 1) {
                  this.rainTransitions.push({
                     position: Box2DHelper.copyVec2(rain.GetPosition()),
                     angle: rain.GetAngle(),
                     time: 0,
                     progress: 0
                  });
               }

               this.rainBodies.splice(i--, 1);

               this.world.DestroyBody(rain);
            }
         }

         // Update player animation
         this.player.position.x = this.playerBody.GetPosition().get_x();
         this.player.position.y = this.playerBody.GetPosition().get_y();

         if (game.keyDown(['LEFT', 'RIGHT'])) {
            this.player.getComponent('Sprite').runAnimation(1, 2, 0.16, true);
         }
         else {
            this.player.getComponent('Sprite').sprite = 0;
         }

         this.player.update(dt);

         this.scoreText.getComponent('Text').set({ 
            text: this.score
         });
      },
      drawRain: function(context, position, angle) {
         var imageSize = 32;

         if (Math.abs(angle) >= 0.1) {
            context.save();
            context.translate(position.get_x() * imageSize, position.get_y() * imageSize);
            context.rotate(angle);

            context.drawImage(waterImg, -0.5 * imageSize, -1.2 * imageSize);
         
            context.restore();
         }
         else {
            context.drawImage(waterImg, (position.get_x() - 0.5) * imageSize, (position.get_y() - 1.2) * imageSize);
         }
      },
      render: function(context) {
         var worldOffsetX = 30, worldOffsetY = 34;
         var imageSize = 32;

         context.lineWidth = 0.1;

         context.save();
         context.scale(20, 20);

         context.mozImageSmoothingEnabled = false;
         context.imageSmoothingEnabled = false;
         context.drawImage(this.groundImg, 0, worldOffsetY, this.game.width, this.game.width * this.groundImg.height / this.groundImg.width);

         context.save();
         context.translate(worldOffsetX, worldOffsetY);

         // Draw jerrycan and player
         var jerrycanPosition = this.jerrycan.GetPosition();
         context.drawImage(jerrycanImg, jerrycanPosition.get_x(), jerrycanPosition.get_y(), 8, 8);

         // this.world.DrawDebugData();

         // Draw seesaw
         {
            context.save();

            var seesawPosition = this.seesawBody.GetPosition();
            var seesawAngle    = this.seesawBody.GetAngle();
            context.translate(seesawPosition.get_x(), seesawPosition.get_y());
            context.rotate(seesawAngle);

            context.drawImage(this.plate, -4.5, -1.7, 9, 2);

            context.restore();
         }

         context.scale(1 / imageSize, 1 / imageSize);
         
         // Draw rain
         for (var i = 0; i < this.rainBodies.length; i ++) {
            var rain = this.rainBodies[i];
            var pos = rain.GetPosition();
            var angle = rain.GetAngle();

            this.drawRain(context, pos, angle);
         }

         for (var i = 0; i < this.rainTransitions.length; i ++) {
            var transition = this.rainTransitions[i];
            var progress   = transition.progress; // [0, 1]

            // Compute interpolated position
            var startX = transition.position.get_x();
            var startY = transition.position.get_y();
            var destX  = jerrycanPosition   .get_x() + 1;
            var destY  = jerrycanPosition   .get_y() + 0.5;

            var pos = new b2Vec2(startX + (destX - startX) * progress, startY + (destY - startY) * progress + 20 * (Math.pow(progress - 0.5, 2) - 0.25));

            this.drawRain(context, pos, transition.angle);
         }

         context.restore();

         // Draw player
         context.save();
         context.translate(worldOffsetX - this.player.width / 2, worldOffsetY - this.player.height / 2);

         this.player.render(context);

         context.restore();

         context.restore();

         // Draw interface
         var waterWidth = 140;
         // context.mozImageSmoothingEnabled = true;
         // context.imageSmoothingEnabled = true;

         var waterX = this.game.width - (waterWidth + 10);
         var waterH = waterWidth * waterUIImg.height / waterUIImg.width;
         context.drawImage(waterUIImg,     waterX, 10, waterWidth, waterH);

         var percentFull = this.water / this.capacity;
         context.drawImage(waterUIFullImg, 0, (1 - percentFull) * waterUIFullImg.height, waterUIFullImg.width, percentFull * waterUIFullImg.height,
                                           waterX, 10 + waterH * (1 - percentFull), waterWidth, waterH * percentFull);
      
         this.scoreText.render(context, this.game.width - waterWidth + 60 - this.scoreText.width / 2, 130);

         var barWidth = 800;
         context.fillStyle = 'rgba(100, 100, 255, 0.9)';
         context.fillRect(Math.floor((this.game.width - barWidth) / 2), 10, Math.ceil(barWidth * this.countdown.time / this.countdown.max), 30);
         this.countdown.render(context, Math.floor(this.game.width / 2 - this.countdown.width / 2), 60);

         var announcementPosition = this.game.width / 2;
         this.announcement.render(context, Math.floor(announcementPosition - this.announcement.width / 2), Math.floor((this.game.height - this.announcement.height) / 2));
      }
   });
})