define(Juicy.Component.create('Sprite', {
    constructor: function(entity) {
        var self = this;

        this.sheet_width   = 0;
        this.sheet_height  = 0;
        this.sprite_width  = 0;
        this.sprite_height = 0;

        this.frametime = -1; // Don't animate yet
        this.timeleft = 0;
        this.repeat = false;
        this.sprite = 0;
        this.first_sprite = 0;
        this.last_sprite = 0;

        this.scale = 1;
        this.flipped = false;
        this.nextFrame = 100;
        this.maxNextFrame = 100;

        this.image = new Image();
        this.image.onload = function() {
            self.sheet_width   = this.width / self.sprite_width;
            self.sheet_height  = this.height / self.sprite_height;

            if (entity) {
                entity.state.updated = true;
            }

            if (self.onload) {
                self.onload(this);
            }
        }
    },

    setImageSrc: function(url) {
        this.image.complete = false;
        this.image.src = url;
    },

    setSheet: function(url, swidth, sheight) {
        this.setImageSrc(url);

        this.frametime = -1; // Don't animate yet
        this.steptime = 0;
        this.repeat = false;
        this.sprite = 0;
        this.last_sprite = 0;

        this.sprite_width  = swidth;
        this.sprite_height = sheight;
        if (this.entity && (!this.entity.width || !this.entity.height)) {
            this.entity.width  = swidth;
            this.entity.height = sheight;
        }

        return this;
    },

    setSize: function(width, height) {
        this.sprite_width = width;
        this.sprite_height = height;
        this.entity.width = width;
        this.entity.height = height;
    },

    runAnimation: function(start, end, frametime, repeat) {
        // Don't re-run animations
        if (this.last_sprite === end && this.frametime === frametime && this.first_sprite === start && this.repeat === repeat) {
            return;
        }

        this.frametime = this.timeleft = frametime;
        this.sprite = this.first_sprite = start;
        this.last_sprite = end;

        this.repeat = repeat;

        return this; // Enable chaining
    },

    advanceAnimation: function(dt) {
        this.nextFrame -= dt;

        if (this.nextFrame < 0) {
            this.nextFrame = this.maxNextFrame;

            this.goNextFrame();
        }
    },

    animating: function() {
        return (this.frametime >= 0 && (this.repeat || this.sprite <= this.last_sprite));
    },

    update: function(dt, input) {
        if (this.animating()) {
            this.timeleft -= dt;

            if (this.timeleft <= 0) {
               this.goNextFrame();
            }
        }
    },

    goNextFrame: function() {
        this.sprite ++;

        this.timeleft = this.frametime;

        if (this.sprite > this.last_sprite) {
            if (this.repeat)
                this.sprite = this.first_sprite;
            else {
                this.sprite = this.last_sprite;
                this.frametime = -1;
                if (this.oncompleteanimation) 
                    this.oncompleteanimation();
            }
        }
    }, 

    render: function(context) {
        context.imageSmoothingEnabled = false;

        context.save();
        if (this.flipped) {
            context.translate(this.entity.width, 0);
            context.scale(-1, 1);
        }

        var sx = (this.sprite % this.sheet_width) * this.sprite_width;
        var sy = Math.floor(this.sprite / this.sheet_width) * this.sprite_height;

        var dx = arguments[5] || arguments[1] || 0;
        var dy = arguments[6] || arguments[2] || 0;
        var dwidth = arguments[7] || arguments[3] || this.entity.width;
        var dheight = arguments[8] || arguments[4] || this.entity.height;

        var scaleAdjustX = (dwidth * this.scale - dwidth) / 2;
        var scaleAdjustY = (dheight * this.scale - dheight) * 3;
        
        if (this.scale == 1) {
            context.drawImage(this.image, sx, sy, this.sprite_width, this.sprite_height,
                              dx, dy, dwidth, dheight);
        }
        else {
            context.drawImage(this.image, sx, sy, this.sprite_width, this.sprite_height,
                              dx - 0.5, dy - scaleAdjustY/3 + 0.125, dwidth * this.scale, dheight * this.scale);            
        }
        context.restore();
    }
}));