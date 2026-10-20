"""ProcTHOR-10K (Apache-2.0) furniture study: convention check for facing and basic statistics.
Usage: python3 procthor_incele.py <houses.jsonl.gz> <asset-database.json>"""
import gzip, json, math, sys, collections
houses, adb = sys.argv[1], json.load(open(sys.argv[2]))
BB = {a['assetId']: a['boundingBox'] for v in adb.values() for a in v}
MAJOR = {'Sofa', 'ArmChair', 'Bed', 'DiningTable', 'CoffeeTable', 'SideTable', 'Desk', 'TVStand', 'Dresser', 'ShelvingUnit', 'Toilet', 'Fridge', 'FloorLamp', 'Chair', 'CounterTop', 'Television', 'Ottoman', 'Stool', 'Bathtub', 'Sink', 'GarbageCan', 'DogBed', 'HousePlant', 'Safe', 'Shelf', 'Cabinet', 'WashingMachine', 'ClothesDryer'}
def segs(poly):
    return [((poly[i]['x'], poly[i]['z']), (poly[(i + 1) % len(poly)]['x'], poly[(i + 1) % len(poly)]['z'])) for i in range(len(poly))]
def dseg(p, a, b):
    dx, dz = b[0] - a[0], b[1] - a[1]; L = dx * dx + dz * dz or 1; t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L))
    return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz), (a[0] + t * dx, a[1] + t * dz)
def inside(p, poly):
    r = False; n = len(poly)
    for i in range(n):
        xi, zi, xj, zj = poly[i]['x'], poly[i]['z'], poly[i - 1]['x'], poly[i - 1]['z']
        if (zi > p[1]) != (zj > p[1]) and p[0] < (xj - xi) * (p[1] - zi) / (zj - zi) + xi: r = not r
    return r
back = collections.Counter(); n = 0
for line in gzip.open(houses, 'rt'):
    h = json.loads(line); n += 1
    for o in h['objects']:
        t = o['id'].split('|')[0]
        if t not in ('Sofa', 'Bed', 'TVStand', 'Dresser', 'Toilet', 'Fridge'): continue
        room = next((r for r in h['rooms'] if inside((o['position']['x'], o['position']['z']), r['floorPolygon'])), None)
        if not room: continue
        p = (o['position']['x'], o['position']['z']); d, q = min((dseg(p, a, b) for a, b in segs(room['floorPolygon'])), key=lambda x: x[0])
        ang = math.degrees(math.atan2(q[0] - p[0], q[1] - p[1])) - o['rotation']['y']   # direction to nearest wall in the object's frame
        back[(t, round(((ang + 360) % 360) / 90) % 4 * 90)] += 1
    if n >= 2000: break
for t in ('Sofa', 'Bed', 'TVStand', 'Dresser', 'Toilet', 'Fridge'):
    print(t, {k[1]: v for k, v in back.items() if k[0] == t})
