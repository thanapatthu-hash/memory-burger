// ============================================================
//  MEMORY BURGER  -  MakeCode Arcade
//  Customers order, then leave. Remember their face + order.
//  When they come back, build the right tray and SERVE.
//
//  Controls:  LEFT/RIGHT = move cursor
//             A = add item (or press GO to serve)
//             B = undo last item
//             UP = serve shortcut
// ============================================================

namespace SpriteKind {
    export const Fx = SpriteKind.create()
}

const PH_ORDER = 0
const PH_SERVE = 1

// ---------- palette indexes (default Arcade palette) ----------
// 1 white, 2 red, 3 pink, 4 orange, 5 yellow, 6 teal, 7 green,
// 8 dark blue, 9 light blue, 10 purple, 11 lilac, 12 dark purple,
// 13 tan, 14 brown, 15 black
const HATS = [2, 7, 5, 10, 15, 4]
const SKINS = [13, 4, 14, 3]
const SHIRTS = [9, 3, 7, 4, 11, 1]
const ITEM_NOTES = [330, 392, 440, 523, 587, 659]

// ---------- item art (12x12) ----------
const ART: string[][] = [
    // burger
    ["...oooooo...", "..oBBsBBBBo.", ".oBBBBBsBBBo", ".oBsBBBBBddo", "oggGggGggGgo", "occcccccccco", "oppppppppppo", "oppppPpppppo", "oGggGggGggGo", ".oddddddddo.", "..oooooooo..", "............"],
    // fries
    ["..oYo.oYo...", ".oYyooYyo.o.", ".oYyyoyyYyo.", "ooyyyoyyyyoo", "oRRRRRRRRRRo", "orrrrrrrrrro", "orrrwwwwrrro", "orrrrwwrrrro", ".orrrrrrrro.", ".orrrrrrrro.", "..oooooooo..", "............"],
    // soda
    ["......oso...", "......oso...", ".ooooosoooo.", ".olllllllllo", "..oLLLLLLo..", "..oCcccccdo.", "..oCcwwwwdo.", "..oCcwRRwdo.", "..oCcwwwwdo.", "...oCccddo..", "...oCccddo..", "....oooooo.."],
    // hot dog
    ["............", "............", "..oooooooo..", ".oBBBBBBBBdo", "osSSSSSSSSso", "osysysysysso", "osssssssssso", "obbbbbbbbbbo", ".obbbbbbbbdo", "..oddddddo..", "...oooooo...", "............"],
    // ice cream
    [".....oho....", "...oooooo...", "..oPPpppmo..", ".oPPpppppmo.", ".opppppppmo.", ".ommpmmmpmo.", "..oCcCcCco..", "..occCcCco..", "...oCcCco...", "....oCcCo...", ".....oCo....", "......o....."],
    // nuggets
    ["............", ".ooooo.ooo..", "oNnnndoNnno.", "onnnndonndo.", ".oodooonoo..", "...ooooooo..", "..oNnnnnnno.", "..onnnndnnno", "..oNnnnnndo.", "...oodddoo..", ".....ooo....", "............"]
]
const ART_KEYS = ["oBsgGpPcd", "oYyRrw", "oslLCcdwR", "oBbdSsy", "ohPpmcC", "oNnd"]
const ART_COLS = [
    [15, 4, 5, 7, 6, 14, 12, 5, 4],
    [15, 5, 4, 3, 2, 1],
    [15, 4, 1, 11, 9, 6, 8, 1, 2],
    [15, 13, 4, 14, 3, 2, 5],
    [15, 2, 1, 3, 2, 4, 14],
    [15, 13, 4, 14]
]

function buildImg(rows: string[], keys: string, cols: number[]): Image {
    const img = image.create(rows[0].length, rows.length)
    for (let y = 0; y < rows.length; y++) {
        for (let x = 0; x < rows[y].length; x++) {
            const i = keys.indexOf(rows[y].charAt(x))
            if (i >= 0) img.setPixel(x, y, cols[i])
        }
    }
    return img
}

const ITEM_S: Image[] = []
const ITEM_B: Image[] = []
for (let i = 0; i < 6; i++) {
    const im = buildImg(ART[i], ART_KEYS[i], ART_COLS[i])
    ITEM_S.push(im)
    ITEM_B.push(im.doubled())
}

const HEART_ROWS = [".HH.HH.", "HHHHHHH", "HHHHHHH", ".HHHHH.", "..HHH..", "...H..."]
const heartOn = buildImg(HEART_ROWS, "H", [2])
const heartOff = buildImg(HEART_ROWS, "H", [12])

// ---------- customer art (16x20) ----------
function makeAvatar(hat: number, skin: number, shirt: number, cap: boolean, gl: boolean, stripe: boolean): Image {
    const rows = [
        "....oooooooo....",
        "...oHHHHHHHHo...",
        "..oHHHhHHHHHHo..",
        cap ? "..oHHHHHHHHHHooo" : "..oHHSSSSSSHHo..",
        cap ? "...oSSSSSSSSo..." : "...oHSSSSSSHo...",
        gl ? "...ogweggwego..." : "...oSweSSweSo...",
        gl ? "...ogggsSgggo..." : "...oSSSsSSSSo...",
        "...oSSmmmmSSo...",
        "....oSSSSSSo....",
        ".....oSSSSo.....",
        "..oTTTTTTTTTTo..",
        ".oTTTTTTTTTTTTo.",
        ".oTTtTTTTTTtTTo.",
        ".oXXXXXXXXXXXXo.",
        ".oTTTTTTTTTTTTo.",
        ".oSTTTTTTTTTTSo.",
        "...oPPPPPPPPo...",
        "...oPPPppPPPo...",
        "...oPPPooPPPo...",
        "..obbbboobbbbo.."
    ]
    return buildImg(rows, "oHhSsewgmTtXPpb", [15, hat, 1, skin, skin, 15, 1, 15, 2, shirt, shirt, stripe ? 1 : shirt, 8, 15, 15])
}

class Customer {
    key: string
    order: number[]
    small: Image
    big: Image
    ret: number
    constructor() {
        this.key = ""
        this.order = []
        this.small = image.create(16, 20)
        this.big = image.create(32, 40)
        this.ret = 0
    }
}

class QEntry {
    c: Customer
    t: number
    constructor(c: Customer, t: number) {
        this.c = c
        this.t = t
    }
}

class FText {
    txt: string
    x: number
    y: number
    life: number
    col: number
    constructor(txt: string, x: number, y: number, col: number) {
        this.txt = txt
        this.x = x
        this.y = y
        this.col = col
        this.life = 1.1
    }
}

// ---------- state ----------
// state 0 = title, 1 = playing, 2 = dying
let state = 0
let score = 0
let lives = 3
let level = 1
let served = 0
let nextT = 1
let away: Customer[] = []
let queue: QEntry[] = []
let cur: Customer = null
let phase = PH_ORDER
let curTimer = 0
let curMax = 1
let lastSec = 99
let tray: number[] = []
let sel = 0
let slide = 0
let shake = 0
let flashT = 0
let gameOverT = 0
let exitImg: Image = null
let exitX = 0
let msgText = ""
let floaters: FText[] = []

const bg = image.create(160, 120)
scene.setBackgroundImage(bg)

const wallImg = image.create(160, 56)
wallImg.fill(12)
for (let yy = 3; yy < 56; yy += 8) {
    const off = (Math.idiv(yy, 8) % 2) * 4 + 2
    for (let xx = off; xx < 160; xx += 8) {
        wallImg.setPixel(xx, yy, 8)
    }
}

// ---------- sound ----------
function blip(f: number, ms: number) {
    music.play(music.tonePlayable(f, ms), music.PlaybackMode.InBackground)
}

function jingle(freqs: number[], ms: number) {
    control.runInParallel(function () {
        for (let f of freqs) {
            if (f <= 0) {
                pause(ms)
            } else {
                music.play(music.tonePlayable(f, ms), music.PlaybackMode.UntilDone)
            }
        }
    })
}

// ---------- effects ----------
function burst(x: number, y: number, e: effects.ParticleEffect, ms: number) {
    const s = sprites.create(image.create(2, 2), SpriteKind.Fx)
    s.setPosition(x, y)
    s.lifespan = ms + 100
    s.startEffect(e, ms)
}

function floatText(t: string, x: number, y: number, col: number) {
    floaters.push(new FText(t, x, y, col))
}

function setMsg(t: string) {
    msgText = t
}

// ---------- game logic ----------
function allCount(): number {
    return queue.length + away.length + (cur != null ? 1 : 0)
}

function keyTaken(k: string): boolean {
    for (let q of queue) if (q.c.key == k) return true
    for (let a of away) if (a.key == k) return true
    if (cur != null && cur.key == k) return true
    return false
}

function newCust(): Customer {
    const c = new Customer()
    let hat = 0
    let skin = 0
    let shirt = 0
    let cap = false
    let gl = false
    let stripe = false
    for (let t = 0; t < 30; t++) {
        hat = HATS[randint(0, HATS.length - 1)]
        skin = SKINS[randint(0, SKINS.length - 1)]
        shirt = SHIRTS[randint(0, SHIRTS.length - 1)]
        cap = Math.percentChance(50)
        gl = Math.percentChance(40)
        stripe = Math.percentChance(50)
        c.key = hat + "," + skin + "," + shirt + "," + (cap ? "1" : "0") + (gl ? "1" : "0") + (stripe ? "1" : "0")
        if (!keyTaken(c.key)) break
    }
    c.small = makeAvatar(hat, skin, shirt, cap, gl, stripe)
    c.big = c.small.doubled()
    const maxN = Math.min(3, 1 + Math.ceil(level / 2))
    const n = randint(1, maxN)
    c.order = []
    for (let i = 0; i < n; i++) c.order.push(randint(0, 5))
    return c
}

function resetGame() {
    score = 0
    lives = 3
    level = 1
    served = 0
    nextT = 0.5
    away = []
    queue = []
    cur = null
    tray = []
    sel = 0
    exitImg = null
    floaters = []
    shake = 0
    flashT = 0
    setMsg("OPEN FOR BUSINESS!")
}

function startExit(c: Customer) {
    exitImg = c.big
    exitX = 6
}

function loseLife(why: string) {
    lives--
    shake = 0.45
    flashT = 0.35
    setMsg(why)
    if (lives <= 0) {
        state = 2
        gameOverT = 1.5
        jingle([330, 311, 294, 262, 247, 196], 150)
    } else {
        jingle([196, 165, 131], 110)
    }
}

function finish(ok: boolean) {
    const c = cur
    startExit(c)
    if (ok) {
        served++
        const bonus = Math.round(curTimer / curMax * 50)
        const gain = 100 + bonus
        score += gain
        setMsg("+" + gain + " CORRECT!")
        floatText("+" + gain, 30, 30, 5)
        burst(22, 40, effects.hearts, 700)
        effects.confetti.startScreenEffect(400)
        jingle([523, 659, 784, 1047], 70)
        const newLevel = 1 + Math.idiv(served, 4)
        if (newLevel > level) {
            level = newLevel
            floatText("LEVEL UP!", 50, 50, 7)
            effects.confetti.startScreenEffect(900)
            control.runInParallel(function () {
                pause(350)
                jingle([523, 659, 784, 1047, 1319, 1568], 80)
            })
        }
    } else {
        burst(22, 40, effects.fire, 500)
        loseLife("WRONG ORDER! -1 LIFE")
    }
    cur = null
    tray = []
}

function serve() {
    if (cur == null || phase != PH_SERVE) {
        blip(150, 80)
        return
    }
    if (tray.length != cur.order.length) {
        blip(150, 80)
        return
    }
    const a = [0, 0, 0, 0, 0, 0]
    const b = [0, 0, 0, 0, 0, 0]
    for (let v of tray) a[v]++
    for (let v of cur.order) b[v]++
    let ok = true
    for (let i = 0; i < 6; i++) {
        if (a[i] != b[i]) ok = false
    }
    finish(ok)
}

function pick(i: number) {
    if (cur == null || phase != PH_SERVE || tray.length >= cur.order.length) {
        blip(150, 60)
        return
    }
    tray.push(i)
    blip(ITEM_NOTES[i], 70)
    burst(36 + (tray.length - 1) * 20, 90, effects.spray, 200)
}

function logic(dt: number) {
    // spawn customers
    nextT -= dt
    const cap = Math.min(3 + level, 7)
    if (nextT <= 0) {
        if (allCount() < cap) {
            queue.push(new QEntry(newCust(), PH_ORDER))
            jingle([988, 1319], 60)
        }
        nextT = Math.max(2.5, 4 + Math.random() * 4 - level * 0.5)
    }
    // customers coming back
    for (let i = away.length - 1; i >= 0; i--) {
        const c = away[i]
        c.ret -= dt
        if (c.ret <= 0) {
            away.removeAt(i)
            queue.push(new QEntry(c, PH_SERVE))
            jingle([784, 659], 70)
        }
    }
    // next customer steps up
    if (cur == null && queue.length > 0) {
        const q = queue.removeAt(0)
        cur = q.c
        phase = q.t
        curTimer = phase == PH_ORDER ? 4 + cur.order.length : Math.max(9, 16 - level)
        curMax = curTimer
        tray = []
        slide = -40
        lastSec = 99
        if (phase == PH_ORDER) {
            setMsg("MEMORIZE FACE + ORDER!")
            jingle([523, 659, 784], 80)
        } else {
            setMsg("WHAT DID THEY ORDER?")
            jingle([392, 330, 392], 90)
        }
    }
    // timer
    if (cur != null) {
        curTimer -= dt
        if (phase == PH_SERVE && curTimer < 3 && curTimer > 0) {
            const s = Math.ceil(curTimer)
            if (s != lastSec) {
                lastSec = s
                blip(220, 60)
            }
        }
        if (curTimer <= 0) {
            if (phase == PH_ORDER) {
                cur.ret = 16 + Math.random() * 14
                away.push(cur)
                startExit(cur)
                burst(22, 44, effects.clouds, 500)
                jingle([440, 330, 262], 60)
                cur = null
                tray = []
                setMsg("THEY LEFT. REMEMBER!")
            } else {
                startExit(cur)
                burst(22, 44, effects.clouds, 500)
                cur = null
                tray = []
                loseLife("TOO SLOW! -1 LIFE")
            }
        }
    }
}

// ---------- rendering ----------
const F5 = image.font5
const F8 = image.font8

function ctext(t: string, y: number, col: number, f: image.Font) {
    bg.print(t, 80 - Math.idiv(t.length * f.charWidth, 2), y, col, f)
}

function drawTitle() {
    bg.fill(12)
    bg.drawImage(wallImg, 0, 0)
    bg.fillRect(0, 100, 160, 20, 14)
    bg.fillRect(0, 100, 160, 2, 4)
    const t = game.runtime() / 1000
    ctext("MEMORY", 8, 15, F8)
    ctext("MEMORY", 7, 5, F8)
    ctext("BURGER", 20, 15, F8)
    ctext("BURGER", 19, 2, F8)
    for (let i = 0; i < 6; i++) {
        const bob = Math.round(Math.sin(t * 4 + i) * 2)
        bg.drawTransparentImage(ITEM_S[i], 20 + i * 20, 36 + bob)
    }
    ctext("1 MEMORIZE FACE + ORDER", 54, 1, F5)
    ctext("2 THEY LEAVE & RETURN", 63, 1, F5)
    ctext("3 BUILD THE RIGHT TRAY", 72, 1, F5)
    ctext("A ADD   B UNDO", 83, 9, F5)
    ctext("UP SERVE", 91, 9, F5)
    if (Math.idiv(game.runtime(), 450) % 2 == 0) {
        ctext("PRESS A TO START", 107, 5, F5)
    }
}

function drawScene() {
    bg.fill(15)
    const active = cur != null && phase == PH_SERVE
    let ox = 0
    let oy = 0
    if (shake > 0) {
        ox = randint(-2, 2)
        oy = randint(-2, 2)
    }

    // HUD
    bg.print("SCORE " + score, 2, 2, 5, F5)
    bg.print("LV " + level, 68, 2, 1, F5)
    bg.print("AWAY " + away.length, 100, 2, 9, F5)
    for (let i = 0; i < 3; i++) {
        bg.drawTransparentImage(i < lives ? heartOn : heartOff, 137 + i * 8, 2)
    }

    // wall + counter
    bg.drawImage(wallImg, 0, 10)
    bg.fillRect(0, 66, 160, 6, 14)
    bg.fillRect(0, 66, 160, 2, 4)

    // customer
    const bob = Math.idiv(game.runtime(), 300) % 2
    if (cur != null) {
        bg.drawTransparentImage(cur.big, 6 + Math.round(slide) + ox, 24 + oy + bob)
    }
    if (exitImg != null && exitX > -34) {
        bg.drawTransparentImage(exitImg, Math.round(exitX), 24)
    }

    // speech bubble
    const bx = 42 + ox
    const by = 12 + oy
    for (let i = 0; i < 6; i++) {
        bg.fillRect(bx - 6 + i, by + 20 - i, 1, 2 * i + 1, 1)
    }
    bg.fillRect(bx, by, 80, 52, 1)
    bg.drawRect(bx, by, 80, 52, 15)
    bg.fillRect(bx, by + 15, 1, 11, 1)
    if (cur == null) {
        bg.print("WAITING FOR", bx + 4, by + 10, 15, F5)
        bg.print("THE NEXT", bx + 4, by + 18, 15, F5)
        bg.print("CUSTOMER...", bx + 4, by + 26, 15, F5)
    } else {
        if (phase == PH_ORDER) {
            bg.print("I'D LIKE:", bx + 4, by + 4, 15, F5)
            for (let i = 0; i < cur.order.length; i++) {
                bg.drawTransparentImage(ITEM_B[cur.order[i]], bx + 4 + i * 25, by + 12)
            }
            bg.print("REMEMBER!", bx + 4, by + 39, 2, F5)
        } else {
            bg.print("I'M BACK!", bx + 4, by + 8, 15, F5)
            bg.print("MY ORDER,", bx + 4, by + 20, 15, F5)
            bg.print("PLEASE!", bx + 4, by + 28, 15, F5)
        }
        // timer bar
        const f = Math.max(0, curTimer / curMax)
        let col = 9
        if (phase == PH_SERVE) {
            col = f < 0.3 ? 2 : 7
            if (f < 0.3 && Math.idiv(game.runtime(), 150) % 2 == 0) col = 5
        }
        bg.fillRect(bx + 3, by + 44, 74, 6, 15)
        bg.fillRect(bx + 4, by + 45, Math.round(72 * f), 4, col)
    }

    // queue panel
    bg.fillRect(124, 12, 35, 53, 15)
    bg.drawRect(124, 12, 35, 53, 11)
    bg.print("QUEUE", 127, 14, 1, F5)
    if (queue.length == 0) {
        bg.print("EMPTY", 127, 36, 11, F5)
    }
    const shown = Math.min(4, queue.length)
    for (let i = 0; i < shown; i++) {
        const qx = 126 + (i % 2) * 16 + ox
        const qy = 22 + Math.idiv(i, 2) * 21 + oy
        bg.drawTransparentImage(queue[i].c.small, qx, qy)
        if (queue[i].t == PH_SERVE) {
            bg.print("B", qx + 10, qy + 14, 5, F5)
        }
    }
    if (queue.length > 4) {
        bg.fillRect(126, 58, 14, 6, 15)
        bg.print("+" + (queue.length - 4), 127, 58, 1, F5)
    }

    // message bar
    bg.fillRect(0, 72, 160, 9, 15)
    bg.print(msgText, 2, 74, 5, F5)

    // tray
    bg.print("TRAY", 2, 86, 5, F5)
    const n = active ? cur.order.length : 0
    for (let i = 0; i < n; i++) {
        const sx = 28 + i * 20
        const full = i < tray.length
        bg.fillRect(sx, 82, 16, 16, 12)
        bg.drawRect(sx, 82, 16, 16, full ? 1 : 11)
        if (full) bg.drawTransparentImage(ITEM_S[tray[i]], sx + 2, 84)
    }
    if (n == 0) {
        bg.print("---", 28, 86, 11, F5)
    }
    bg.print("A ADD", 104, 83, 11, F5)
    bg.print("B UNDO", 104, 90, 11, F5)

    // item bar
    const ready = active && tray.length == cur.order.length
    const blink = Math.idiv(game.runtime(), 250) % 2 == 0
    for (let i = 0; i < 7; i++) {
        const x = 3 + i * 22
        const y = 99
        bg.fillRect(x, y, 21, 20, active ? 12 : 15)
        bg.drawRect(x, y, 21, 20, 8)
        if (i < 6) {
            bg.drawTransparentImage(ITEM_S[i], x + 4, y + 1)
            bg.print("" + (i + 1), x + 9, y + 14, active ? 1 : 11, F5)
        } else {
            bg.fillRect(x + 1, y + 1, 19, 18, ready ? 7 : 15)
            bg.print("GO", x + 5, y + 8, ready ? 15 : 11, F5)
        }
    }
    const cx = 3 + sel * 22
    const cc = blink ? 5 : 1
    bg.drawRect(cx, 99, 21, 20, cc)
    bg.drawRect(cx + 1, 100, 19, 18, cc)

    // floating text
    for (let ft of floaters) {
        bg.print(ft.txt, ft.x + 1, Math.round(ft.y) + 1, 15, F5)
        bg.print(ft.txt, ft.x, Math.round(ft.y), ft.col, F5)
    }

    // flash on mistakes
    if (flashT > 0) {
        bg.drawRect(0, 0, 160, 120, 2)
        bg.drawRect(1, 1, 158, 118, 2)
        bg.drawRect(2, 2, 156, 116, 2)
    }
}

// ---------- main loop ----------
game.onUpdate(function () {
    const dt = control.eventContext().deltaTime

    if (state == 0) {
        drawTitle()
        return
    }

    // animation timers
    slide = slide * Math.max(0, 1 - dt * 10)
    if (shake > 0) shake -= dt
    if (flashT > 0) flashT -= dt
    if (exitImg != null) {
        exitX -= 150 * dt
        if (exitX < -34) exitImg = null
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
        floaters[i].y -= 18 * dt
        floaters[i].life -= dt
        if (floaters[i].life <= 0) floaters.removeAt(i)
    }

    if (state == 1) {
        logic(dt)
    } else if (state == 2) {
        gameOverT -= dt
        if (gameOverT <= 0) {
            info.setScore(score)
            game.over(false, effects.melt)
        }
    }

    drawScene()
})

// ---------- controls ----------
controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state != 1) return
    sel = (sel + 6) % 7
    blip(600, 15)
})

controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state != 1) return
    sel = (sel + 1) % 7
    blip(600, 15)
})

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state == 0) {
        resetGame()
        state = 1
        jingle([523, 659, 784, 659, 784, 1047], 90)
        return
    }
    if (state != 1) return
    if (sel < 6) {
        pick(sel)
    } else {
        serve()
    }
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state != 1) return
    if (tray.length > 0) {
        tray.pop()
        blip(196, 60)
    } else {
        blip(150, 40)
    }
})

controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (state != 1) return
    serve()
})