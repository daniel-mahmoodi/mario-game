kaboom({
    global: true,
    fullscreen: true,
    scale: 1,
    debug: true,
    clearColor: [0, 0, 0, 1],
})

const MOVE_SPEED = 120
const JUMP_FORCE = 360
const BIG_JUMP_FORCE = 550
let CURRENT_JUMP_FORCE = JUMP_FORCE
const ENEMY_SPEED = 20
let isJumping = true
const FALL_DEATH = 400

loadSprite('coin', './img/coin.png')
loadSprite('evil-shroom', './img/evil-shroom.png')
loadSprite('brick', './img/brick.png')
loadSprite('block', './img/block.png')
loadSprite('mario', './img/mario.png')
loadSprite('mushroom', './img/mushroom.png')
loadSprite('surprise', './img/surprise.png')
loadSprite('unboxed', './img/unboxed.png')
loadSprite('pipe-top-left', './img/pipe-top-left.png')
loadSprite('pipe-top-right', './img/pipe-top-right.png')
loadSprite('pipe-bottom-left', './img/pipe-bottom-left.png')
loadSprite('pipe-bottom-right', './img/pipe-bottom-right.png')


loadSprite('blue-block', './img/blueBlock.png')
loadSprite('blue-brick', './img/blueBrick.png')
loadSprite('blue-steel', './img/blueSteel.png')
loadSprite('blue-evil-shroom', './img/blueEvil-shroom.png')
loadSprite('blue-surprise', './img/blueSurprise.png')


scene("game", ({ level, score }) => {
    layers(['bg', 'obj', 'ui'], 'obj')

    const maps = [
        [
            '                                                                                  ',
            '                                                                                  ',
            '                                                                                  ',
            '                                                                                  ',
            '                                                                                  ',
            '                                                                                  ',
            '          %    =*=%=                                             =                ',
            '                                                               ===                ',
            '                                 -+                         ======                ',
            '                          ^   ^  ()                      =========                ',
            '===================================   ============================  ==============',
        ],
        [
            'v                                                                                 v',
            'v                                                                                 v',
            'v                                                                                 v',
            'v                                                                                 v',
            'v                                             X                                   v',
            'v                                           X X                                   v',
            'v             @@@@@@                      X X X                                   v',
            'v                                       X X X X                                   v',
            'v                                     X X X X X  X                              -+v',
            'v                      z    z       X X X X X X  X                              ()v',
            '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!',
        ]
    ]
    const levelCfg = {
        width: 20,
        height: 20,
        '=': [sprite('block'), solid()],
        '$': [sprite('coin'), 'coin'],
        '%': [sprite('surprise'), solid(), 'coin-surprise'],
        '*': [sprite('surprise'), solid(), 'mushroom-surprise'],
        '}': [sprite('unboxed'), solid()],
        '(': [sprite('pipe-bottom-left'), solid(), scale(0.5)],
        ')': [sprite('pipe-bottom-right'), solid(), scale(0.5)],
        '-': [sprite('pipe-top-left'), solid(), scale(0.5), 'pipe'],
        '+': [sprite('pipe-top-right'), solid(), scale(0.5), 'pipe'],
        '^': [sprite('evil-shroom'), solid(), 'dangerous'],
        '#': [sprite('mushroom'), solid(), 'mushroom', body()],

        '!': [sprite('blue-block'), solid(), scale(0.5)],
        'v': [sprite('blue-brick'), solid(), scale(0.5)],
        'z': [sprite('blue-evil-shroom'), solid(), scale(0.5), 'dangerous'],
        '@': [sprite('blue-surprise'), solid(), scale(0.5), 'coin-surprise'],
        'X': [sprite('blue-brick'), solid(), scale(0.5)],
    }



    const gameLevel = addLevel(maps[level], levelCfg)

    const scoreLabel = add([
        text(score),
        pos(30, 16),
        layer('ui'),
        {
            value: score,
        }
    ])
    add([text('level' + parseInt(level + 1)), pos(4, 6)])

    function big() {
        let timer = 0
        let isBig = false
        return {
            update() {
                if (isBig) {
                    CURRENT_JUMP_FORCE = BIG_JUMP_FORCE
                    timer -= dt()
                    if (timer <= 0) {
                        this.smallify()
                    }
                }
            },
            isBig() {
                return isBig
            },
            smallify() {
                this.scale = vec2(1)
                CURRENT_JUMP_FORCE = JUMP_FORCE
                timer = 0
                isBig = false
            },
            biggify(time) {
                this.scale = vec2(2)

                timer = time
                isBig = true
            }

        }
    }


    const player = add([
        sprite('mario'),
        solid(),
        pos(30, 0),
        body(),
        big(),
        origin('bot')
    ])

    action('mushroom', (m) => {
        m.move(20, 0)
    })
    action('dangerous', (d) => {
        d.move(-ENEMY_SPEED, 0)
    })
    player.collides('dangerous', (d) => {
        if (isJumping) {
            destroy(d)
        } else {
            go('lose', { score: scoreLabel.value })
            console.log('lise');
        }
    })

    player.on("headbump", (obj) => {
        if (obj.is('coin-surprise')) {
            gameLevel.spawn('$', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }
        if (obj.is('mushroom-surprise')) {
            gameLevel.spawn('#', obj.gridPos.sub(0, 1))
            destroy(obj)
            gameLevel.spawn('}', obj.gridPos.sub(0, 0))
        }

    })
    player.collides('mushroom', (m) => {
        destroy(m)
        player.biggify(6)
    })
    player.collides('coin', (c) => {
        destroy(c)
        scoreLabel.value++
            scoreLabel.text = scoreLabel.value
    })

    player.action(() => {
        camPos(player.pos)
        if (player.pos.y >= FALL_DEATH) {
            go('lose', { score: scoreLabel.value })
        }
    })
    player.collides('pipe', () => {
        keyPress('down', () => {
            go('game', {
                level: (level + 1) % maps.length,
                score: scoreLabel.value
            })
        })
    })

    keyDown('left', () => {
        player.move(-MOVE_SPEED, 0)
    })
    keyDown('right', () => {
        player.move(MOVE_SPEED, 0)
    })
    player.action(() => {
        if (player.grounded()) {
            isJumping = false
        }
    })
    keyPress('space', () => {
        if (player.grounded()) {
            isJumping = true
            player.jump(CURRENT_JUMP_FORCE)
        }
    })

})
scene("lose", ({ score }) => {
    add([text(score, 32), origin('center'), pos(width() / 2, height() / 2)])
})

start("game", { level: 0, score: 0 });