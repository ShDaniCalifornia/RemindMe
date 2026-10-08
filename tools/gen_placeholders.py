"""Генерирует Lottie-заглушки: круглый «колобок» с глазами и ртом. Запуск: python3 tools/gen_placeholders.py"""
import json, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'character', 'lottie-placeholders')
FR, OP = 30, 90
EASE = lambda n: ({'x': [0.5] * n, 'y': [1] * n}, {'x': [0.5] * n, 'y': [0] * n})

def hex2rgb(h):
    h = h.lstrip('#'); return [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)] + [1]

def static(v): return {'a': 0, 'k': v}

def anim(frames):  # frames: [(t, [values])]
    n = len(frames[0][1]); i, o = EASE(n)
    ks = [{'t': t, 's': v, 'i': i, 'o': o} for t, v in frames[:-1]]
    ks.append({'t': frames[-1][0], 's': frames[-1][1]})
    return {'a': 1, 'k': ks}

def ellipse_layer(ind, name, pos, size, color, scale=None, parent=1):
    return {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': name, 'parent': parent, 'sr': 1,
            'ks': {'o': static(100), 'r': static(0), 'p': static(pos + [0]), 'a': static([0, 0, 0]),
                   's': scale or static([100, 100, 100])},
            'ao': 0, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0,
            'shapes': [{'ty': 'gr', 'nm': name, 'it': [
                {'ty': 'el', 'p': static([0, 0]), 's': static(size), 'nm': 'shape'},
                {'ty': 'fl', 'c': static(hex2rgb(color)), 'o': static(100), 'r': 1, 'nm': 'fill'},
                {'ty': 'tr', 'p': static([0, 0]), 'a': static([0, 0]), 's': static([100, 100]),
                 'r': static(0), 'o': static(100), 'sk': static(0), 'sa': static(0)}]}]}

def root_layer(motion):
    p, r, s = [100, 100, 0], 0, [100, 100, 100]
    if motion == 'breathe':
        sc = anim([(0, [100, 100, 100]), (45, [103, 103, 100]), (90, [100, 100, 100])]); pos = static(p); rot = static(0)
    elif motion == 'slow':   # сон: медленное глубокое дыхание
        sc = anim([(0, [100, 100, 100]), (45, [107, 107, 100]), (90, [100, 100, 100])]); pos = static(p); rot = static(0)
    elif motion == 'bounce':
        sc = static(s); rot = static(0)
        pos = anim([(0, [100, 108, 0]), (22, [100, 92, 0]), (45, [100, 108, 0]), (67, [100, 92, 0]), (90, [100, 108, 0])])
    else:                    # sway: лёгкое покачивание
        sc = static(s); pos = static(p)
        rot = anim([(0, [-3]), (45, [3]), (90, [-3])])
    return {'ddd': 0, 'ind': 1, 'ty': 3, 'nm': 'root', 'sr': 1,
            'ks': {'o': static(100), 'r': rot, 'p': pos, 'a': static([0, 0, 0]), 's': sc},
            'ao': 0, 'ip': 0, 'op': OP, 'st': 0, 'bm': 0}

# имя: (цвет, движение, размер рта, глаза закрыты?)
STATES = {
    'calm':     ('#9FB8A1', 'breathe', [26, 8],  False),
    'happy':    ('#F2C879', 'bounce',  [40, 22], False),
    'cheer':    ('#EE9B8C', 'bounce',  [44, 30], False),
    'shy':      ('#F3B7B0', 'sway',    [14, 8],  False),
    'sleep':    ('#B8B5D6', 'slow',    [10, 6],  True),
    'thinking': ('#A9C3D6', 'sway',    [10, 10], False),
    'worried':  ('#CFC6B8', 'sway',    [24, 8],  False),
    'loving':   ('#F0A3B5', 'breathe', [20, 14], False),
}

for name, (color, motion, mouth, closed) in STATES.items():
    if closed:
        blink = static([100, 12, 100])
    else:
        blink = anim([(0, [100, 100, 100]), (60, [100, 100, 100]), (64, [100, 10, 100]), (68, [100, 100, 100]), (90, [100, 100, 100])])
    layers = [
        root_layer(motion),
        ellipse_layer(2, 'mouth', [0, 30], mouth, '#4A3F3A'),
        ellipse_layer(3, 'eye_r', [28, -8], [14, 18], '#2A2A2A', blink),
        ellipse_layer(4, 'eye_l', [-28, -8], [14, 18], '#2A2A2A', blink),
        ellipse_layer(5, 'body', [0, 0], [150, 150], color),
    ]
    doc = {'v': '5.7.0', 'fr': FR, 'ip': 0, 'op': OP, 'w': 200, 'h': 200, 'nm': name, 'ddd': 0, 'assets': [], 'layers': layers}
    with open(os.path.join(OUT, f'{name}.json'), 'w') as f: json.dump(doc, f)
    print('ok', name)
