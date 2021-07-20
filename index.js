const canvas = document.getElementById('stage');
// Basic PIXI Setup
const rendererOptions = {
    width: canvas.width,
    height: canvas.height,
    view: canvas,
};
const stage = new PIXI.Container();
const renderer = new PIXI.Renderer(rendererOptions);

const rainContainer = new PIXI.particles.LinkedListContainer();
const cloudContainer = new PIXI.particles.LinkedListContainer();
const lightningContainer = new PIXI.particles.LinkedListContainer();
const flashContainer = new PIXI.particles.LinkedListContainer();

const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
bg.scale.x = canvas.width;
bg.scale.y = canvas.height;
bg.tint = 0x000010;
stage.addChild(bg);

// NOTE: art credits:
// rain/wind icons: J. W. Bjerk (eleazzaar) -- www.jwbjerk.com/art  -- find this and other open art at: http://opengameart.org
// smoke/cloud particle: www.kenney.nl
// rain particle: pixi particle-emitter asset

// Audio credits:
// wind loop: Created by Jonathan Shaw (InspectorJ): https://freesound.org/people/InspectorJ/sounds/376415/
// rain loop: https://opengameart.org/content/rain-loopable
// https://opengameart.org/content/thunder-rain-and-wind

stage.addChild(lightningContainer, rainContainer, cloudContainer, flashContainer);

let cloudEmitter, lightningEmitter, rainEmitter, flashEmitter;

const THUNDER_AUDIO = [
    ['thunder_1_far', 'thunder_1_near'],
    ['thunder_2_far', 'thunder_2_near'],
    ['thunder_3_far', 'thunder_3_near'],
    ['thunder_4_far', 'thunder_4_near'],
    ['thunder_5_far', 'thunder_5_near'],
    ['thunder_6_far', 'thunder_6_near']
];
const MAX_DELAY = 5000;
const RAIN_WIND_ANGLE = 65;
const RAIN_ANGLE = 90;

class LightningParticle
{
    constructor(config)
    {
        this.order = 2;
        this.maxDistance = config.maxDistance;
        this.minDistance = config.minDistance;
        this.maxIntensity = config.maxIntensity;
        this.minIntensity = config.minIntensity;
    }

    initParticles(first)
    {
        let next = first;

        while (next) {
            next.anchor.set(0.5, 0);

            const intensity = (Math.random() * (this.maxIntensity - this.minIntensity)) + this.minIntensity;
            const distance = (Math.random() * (this.maxDistance - this.minDistance)) + this.minDistance;
            const xScale = Math.random() + 1.5;
            const yScale = Math.random() + 1.5;

            next.scale.set(intensity * (1-distance) * xScale, intensity * (1-distance) * yScale);

            const sfxIndex = Math.floor((Math.random() * THUNDER_AUDIO.length));
            const sound = THUNDER_AUDIO[sfxIndex][distance > 0.5 ? 0 : 1];
            let volume = (intensity * 0.25 + 0.75);
            setTimeout(() => {
                sound.play({volume});
            }, MAX_DELAY * (1-distance));

            flashEmitter.getBehavior('alphaMult').alphaMult = intensity * (1 - distance);
            flashEmitter.emitNow();

            next = next.next;
        }
    }
}
LightningParticle.type = 'lightning';
PIXI.particles.Emitter.registerBehavior(LightningParticle);

class AlphaWithMultiplier
{
    constructor(config)
    {
        this.order = 2;
        this.list = new PIXI.particles.PropertyList(false);
        this.list.reset(PIXI.particles.PropertyNode.createList(config.alpha));
        this.alphaMult = config.alphaMult;
    }

    initParticles(first)
    {
        let next = first;

        while (next) {
            next.alpha = this.list.first.value * this.alphaMult;
            next.config.alphaMult = this.alphaMult;
            next = next.next;
        }
    }

    updateParticle(particle)
    {
        particle.alpha = this.list.interpolate(particle.agePercent) * particle.config.alphaMult;
    }
}
AlphaWithMultiplier.type = 'alphaMult';
PIXI.particles.Emitter.registerBehavior(AlphaWithMultiplier);

class FillScreen
{
    constructor(config)
    {
        this.order = 2;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    initParticles(first)
    {
        let next = first;

        while (next) {
            next.texture = PIXI.Texture.WHITE;
            next.anchor.set(0, 0);
            next.width = this.width;
            next.height = this.height;
            next = next.next;
        }
    }
}
FillScreen.type = 'fillScreen';
PIXI.particles.Emitter.registerBehavior(FillScreen);

const loader = PIXI.Loader.shared;
loader.add('particles', 'images/particles.json');
loader.add('rain', 'audio/rain.{opus,caf,mp3}');
loader.add('wind', 'audio/wind-01.{opus,caf,mp3}');
for (let i = 0; i < THUNDER_AUDIO.length; ++i)
{
    for (let k = 0; k < THUNDER_AUDIO[i].length; ++k)
    {
        loader.add(THUNDER_AUDIO[i][k], `audio/${THUNDER_AUDIO[i][k]}.{opus,caf,mp3}`);
    }
}

loader.load((loader, resources) => {
    for (let i = 0; i < THUNDER_AUDIO.length; ++i)
    {
        for (let k = 0; k < THUNDER_AUDIO[i].length; ++k)
        {
            THUNDER_AUDIO[i][k] = resources[THUNDER_AUDIO[i][k]].sound;
        }
    }

    // create our many emitters
    cloudEmitter = new PIXI.particles.Emitter(cloudContainer, {
        "lifetime": {
            "min": 10,
            "max": 8
        },
        "frequency": 0.05,
        "emitterLifetime": 0,
        "maxParticles": 1000,
        "addAtBack": true,
        "pos": {
            "x": 0,
            "y": 0
        },
        "behaviors": [{
                "type": "alpha",
                "config": {
                    "alpha": {
                        "list": [{
                                "time": 0,
                                "value": 0
                            },
                            {
                                "time": 0.1,
                                "value": 1
                            },
                            {
                                "time": 0.9,
                                "value": 1
                            },
                            {
                                "time": 1,
                                "value": 0
                            }
                        ]
                    }
                }
            },
            {
                "type": "scaleStatic",
                "config": {
                    "min": 0.8,
                    "max": 1,
                }
            },
            {
                "type": "colorStatic",
                "config": {
                    "color": "aaaaaa",
                }
            },
            {
                "type": "rotationStatic",
                "config": {
                    "min": 0,
                    "max": 360
                }
            },
            {
                "type": "textureSingle",
                "config": {
                    "texture": "smoke_04",
                }
            },
            {
                "type": "spawnShape",
                "config": {
                    "type": "rect",
                    "data": {
                        "x": 0,
                        "y": 0,
                        "w": window.innerWidth,
                        "h": 40,
                    }
                }
            }
        ]
    });
    rainEmitter = new PIXI.particles.Emitter(rainContainer, {
        "lifetime": {
            "min": 0.81,
            "max": 0.81
        },
        "frequency": 0.004 * window.innerWidth / 1024,
        "emit": false,
        "emitterLifetime": 0,
        "maxParticles": 1000,
        "addAtBack": false,
        "pos": {
            "x": 0,
            "y": 0
        },
        "behaviors": [{
                "type": "alphaStatic",
                "config": {
                    "alpha": 0.25
                }
            },
            {
                "type": "moveSpeedStatic",
                "config": {
                    "min": 2000,
                    "max": 2000
                }
            },
            {
                "type": "scaleStatic",
                "config": {
                    "min": 0.7,
                    "max": 0.7
                }
            },
            {
                "type": "rotationStatic",
                "config": {
                    "min": RAIN_ANGLE,
                    "max": RAIN_ANGLE
                }
            },
            {
                "type": "textureSingle",
                "config": {
                    "texture": "HardRain"
                }
            },
            {
                "type": "spawnShape",
                "config": {
                    "type": "rect",
                    "data": {
                        "x": -400,
                        "y": -200,
                        "w": window.innerWidth + 400,
                        "h": 0
                    }
                }
            }
        ]
    });
    flashEmitter = new PIXI.particles.Emitter(flashContainer, {
        "lifetime": {
            "min": 0.4,
            "max": 0.4
        },
        "frequency": 0.05,
        "emit": false,
        "emitterLifetime": 0,
        "maxParticles": 1000,
        "addAtBack": true,
        "pos": {
            "x": 0,
            "y": 0
        },
        "behaviors": [{
                "type": "alphaMult",
                "config": {
                    "alpha": {
                        "list": [{
                                "time": 0,
                                "value": 1
                            },
                            {
                                "time": 0.33,
                                "value": 0
                            },
                            {
                                "time": 0.66,
                                "value": 1
                            },
                            {
                                "time": 1,
                                "value": 0
                            }
                        ],
                        "isStepped": true,
                    },
                    "alphaMult": 1,
                }
            },
            {
                "type": "fillScreen",
                "config": {}
            },
            {
                "type": "textureSingle",
                "config": {
                    "texture": PIXI.Texture.WHITE,
                }
            },
            {
                "type": "spawnPoint",
                "config": {}
            }
        ]
    });
    lightningEmitter = new PIXI.particles.Emitter(lightningContainer, {
        "lifetime": {
            "min": 0.4,
            "max": 0.4
        },
        "frequency": 0.05,
        "emit": false,
        "emitterLifetime": 0,
        "maxParticles": 1000,
        "addAtBack": true,
        "pos": {
            "x": 0,
            "y": 0
        },
        "behaviors": [{
                "type": "alpha",
                "config": {
                    "alpha": {
                        "list": [{
                                "time": 0,
                                "value": 1
                            },
                            {
                                "time": 0.33,
                                "value": 0
                            },
                            {
                                "time": 0.66,
                                "value": 1
                            },
                            {
                                "time": 1,
                                "value": 0
                            }
                        ],
                        "isStepped": true,
                    }
                }
            },
            {
                "type": "textureRandom",
                "config": {
                    "textures": ["lightning", "lightning2", "lightning3", "lightning4"]
                }
            },
            {
                "type": "spawnShape",
                "config": {
                    "type": "rect",
                    "data": {
                        "x": 100,
                        "y": 50,
                        "w": window.innerWidth - 200,
                        "h": 0
                    }
                }
            },
            {
                "type": "lightning",
                "config": {
                    "minDistance": 0,
                    "maxDistance": 0.8,
                    "minIntensity": 0.4,
                    "maxIntensity": 1,
                }
            },
        ]
    });

    const rainBtn = document.getElementById('toggleRain');
    rainBtn.addEventListener('click', () => {
        const enabled = !rainBtn.classList.toggle('inactive');
        rainEmitter.emit = enabled;
        if (enabled)
        {
            resources.rain.sound.play({
                loop: true,
                volume: 0.15,
            });
        }
        else
        {
            resources.rain.sound.stop();
        }
    });

    const windBtn = document.getElementById('toggleWind');
    windBtn.addEventListener('click', () => {
        const enabled = !windBtn.classList.toggle('inactive');
        const b = rainEmitter.getBehavior('rotationStatic');
        if (enabled) {
            b.min = b.max = RAIN_WIND_ANGLE * PIXI.particles.ParticleUtils.DEG_TO_RADS;
            resources.wind.sound.play({
                loop: true,
                volume: 0.15,
            });
        } else {
            b.min = b.max = RAIN_ANGLE * PIXI.particles.ParticleUtils.DEG_TO_RADS;
            resources.wind.sound.stop();
        }
    });
});
// Calculate the current time
let elapsed = Date.now();
let updateId;

// Update function every frame
const update = () => {
    // Update the next frame
    updateId = requestAnimationFrame(update);

    const now = Date.now();
    const deltaSec = (now - elapsed) * 0.001;

    // UPDATE EMITTERS
    if (cloudEmitter)
    {
        cloudEmitter.update(deltaSec);
        rainEmitter.update(deltaSec);
        lightningEmitter.update(deltaSec);
        flashEmitter.update(deltaSec);
    }

    elapsed = now;

    // render the stage
    renderer.render(stage);
};

// Resize the canvas to the size of the window
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderer.resize(canvas.width, canvas.height);
    if (bg) {
        bg.width = canvas.width;
        bg.height = canvas.height;
    }
    if (flashEmitter)
    {
        const b = flashEmitter.getBehavior('fillScreen');
        b.width = canvas.width;
        b.height = canvas.height;
    }
    if (lightningEmitter)
    {
        const b = lightningEmitter.getBehavior('spawnShape');
        b.shape.w = canvas.width - 200;
    }
    if (cloudEmitter)
    {
        const b = cloudEmitter.getBehavior('spawnShape');
        b.shape.w = canvas.width;
    }
    if (rainEmitter)
    {
        const b = rainEmitter.getBehavior('spawnShape');
        b.shape.w = canvas.width + 400;
        rainEmitter.frequency = 0.004 * canvas.width / 1024;
    }
};
window.onresize();

// Click on the canvas to trigger
canvas.addEventListener('PointerEvent' in window ? 'pointerup' : 'touchend', (e) => {
    e.preventDefault();
    if (!lightningEmitter) return;

    lightningEmitter.emitNow();
});

// Start the update
update();